import { AppState } from "../app/state";
import type { ExtractionRecipe, Recipe } from "../crafting-data";
// import { buildTreeNode } from "../main-script";

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
    const rawMaterials = {};

    const root = buildTreeNode(
        targetMaterial,
        undefined,
        new Set(),
        rawMaterials,
        state,
        recipes
    );

    if (root.duration && root.duration > 0) {
        addNodeUtilization(root, root.duration);
    }

    const extractorRequirements = [];

    for (const [material, amount] of Object.entries(rawMaterials)) {
        if (!(typeof amount === "number")) {
            continue;
        }
        const extraction = extractionRecipes[material];

        if (!extraction || !root.duration) {
            continue;
        }

        const availability = materialAvailability[material] || 5;
        const availabilityModifer = availability * 0.16 + 0.2;

        const extractionCycles =
            (amount * extraction.duration) /
            (extraction.amount * availabilityModifer * root.duration);

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
    if (
        node.duration != null &&
        totalDuration > 0
    ) {
        node.utilization = node.duration / totalDuration;
    } else {
        node.utilization = null;
    }

    for (const child of node.children) {
        addNodeUtilization(child, totalDuration);
    }
}

function recipesProducing(material: string, recipes: Recipe[]) {
    return recipes.filter(recipe =>
        recipe.outputs.some(output => output.material === material)
    );
}

function getSelectedRecipe(state: AppState, material: string, recipes: Recipe[]) {
    const choices = recipesProducing(material, recipes);

    if (choices.length === 0) {
        return null;
    }

    const selectedIndex = state.recipeChoices.get(material) ?? 0;
    return choices[selectedIndex] ?? choices[0];
}


function getOutput(recipe: Recipe, material: string) {
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

        rawMaterials[targetMaterial] =
            (rawMaterials[targetMaterial] ?? 0) + amount;

        return {
            material: targetMaterial,
            amount,
            cycles: null,
            duration: null,
            children: [],
            isRaw: true,
            cycleDetected: false
        };
    }

    // Prevent recursive recipes from causing infinite recursion.
    if (visited.has(targetMaterial)) {
        return {
            material: targetMaterial,
            amount: requiredAmount ?? 0,
            cycles: null,
            duration: null,
            children: [],
            isRaw: false,
            cycleDetected: true
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