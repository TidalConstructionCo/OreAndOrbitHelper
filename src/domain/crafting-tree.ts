import { AppState } from "../app/state";
import type { ExtractionRecipe, MaterialAmount, Recipe } from "../crafting-data";

type TreeNodeBase = {
    material: string;
    amount: number;
    children: TreeNode[];
    isRaw: boolean;
    cycleDetected: boolean;

    // Store utilization as a decimal:
    // 1 = 100%, 0.5 = 50%, etc.
    utilization: number | null;
};

type RecipeTreeNode = TreeNodeBase & {
    isRaw: false;
    cycles: number;
    duration: number;
    recipe: Recipe;
};

type RawTreeNode = TreeNodeBase & {
    isRaw: true;
    cycles: null;
    duration: null;
    recipe?: never;
};

export type TreeNode = RecipeTreeNode | RawTreeNode;

export type ExtractorRequirement = {
    material: string;
    amount: number;
    extractors: number;
    extractionCyclesPerExtractor: number;
    extractionDuration: number;
};

export type CraftingTree = {
    root: TreeNode;
    rawMaterials: Record<string, number>;
    extractorRequirements: ExtractorRequirement[];
};




export function buildCraftingTree(
    extractionRecipes: Record<string, ExtractionRecipe>,
    materialAvailability: Record<string, number>,
    targetMaterial: string,
    state: AppState,
    recipes: Recipe[],
): CraftingTree {
    const rawMaterials: Record<string, number> = {};

    const root = buildTreeNode(
        targetMaterial,
        undefined,
        new Set(),
        rawMaterials,
        state,
        recipes
    );

    const totalDuration = root.duration;
    if (totalDuration && totalDuration > 0) {
        addNodeUtilization(root, totalDuration);
    }

    const extractorRequirements: ExtractorRequirement[] = [];

    for (const [material, amount] of Object.entries(rawMaterials)) {
        const extraction = extractionRecipes[material];

        if (!extraction || !totalDuration) {
            continue;
        }

        const availability = materialAvailability[material] || 5;
        const availabilityModifier = availability * 0.16 + 0.2;

        const extractionCycles =
            (amount * extraction.duration) /
            (extraction.amount * availabilityModifier * totalDuration);

        const extractors =
            Math.ceil(extractionCycles * 1000) / 1000;

        extractorRequirements.push({
            material,
            amount,
            extractors,
            extractionCyclesPerExtractor: extractionCycles,
            extractionDuration: extraction.duration
        });
    }

    return {
        root,
        rawMaterials,
        extractorRequirements
    };
}

function addNodeUtilization(node: TreeNode, totalDuration: number) {
    if (node.duration != null && totalDuration > 0) {
        node.utilization = node.duration / totalDuration;
    } else {
        node.utilization = null;
    }

    for (const child of node.children) {
        addNodeUtilization(child, totalDuration);
    }
}

function getSelectedRecipe(state: AppState, material: string, recipes: Recipe[]): Recipe | undefined {
    const choices = recipes.filter(recipe => recipe.outputs.some(output => output.material === material && output.amount > 0));

    if (choices.length === 0) {
        return undefined;
    }

    const selectedIndex = state.recipeChoices.get(material) ?? 0;
    return choices[selectedIndex] ?? choices[0];
}


function getOutput(recipe: Recipe, material: string): MaterialAmount | undefined {
    return recipe.outputs.find(output => output.material === material);
}


function buildTreeNode(
    targetMaterial: string,
    requiredAmount: number | undefined,
    visited: Set<string>,
    rawMaterials: Record<string, number>,
    state: AppState,
    recipes: Recipe[]
): TreeNode {
    const recipe = getSelectedRecipe(state, targetMaterial, recipes);

    // No crafting recipe: this is a raw material.
    if (!recipe) {
        const amount = requiredAmount ?? 1;

        rawMaterials[targetMaterial] = (rawMaterials[targetMaterial] ?? 0) + amount;
        return {
            material: targetMaterial,
            amount,
            children: [],
            isRaw: true,
            cycleDetected: false,
            utilization: null,
            cycles: null,
            duration: null,
        };
    }

    // Prevent recursive recipes from causing infinite recursion.
    if (visited.has(targetMaterial)) {
        return {
            material: targetMaterial,
            amount: requiredAmount ?? 0,
            children: [],
            isRaw: false,
            cycleDetected: true,
            utilization: null,
            cycles: null,
            duration: null,
            recipe,
        };
    }

    // TODO: handle undefined
    const output = getOutput(recipe, targetMaterial);

    let cycles;
    let amount;

    if (requiredAmount == null) {
        // The root represents one complete recipe cycle.
        cycles = 1;
        amount = output.amount;
    } else {
        amount = requiredAmount;
        cycles = requiredAmount / output.amount;
    }

    const node = {
        material: targetMaterial,
        amount,
        cycles,
        duration: recipe.duration * cycles,
        recipe,
        children: [],
        isRaw: false,
        cycleDetected: false
    };


    const nextVisited = new Set(visited);
    nextVisited.add(targetMaterial);

    for (const ingredient of recipe.inputs) {
        const childAmount = ingredient.amount * cycles;

        node.children.push(
            buildTreeNode(
                ingredient.material,
                childAmount,
                nextVisited,
                rawMaterials,
                state,
                recipes,
            )
        );
    }

    return node;
}