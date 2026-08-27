// TODO: is that the correct recipe type?
import { ExtractionRecipe, Recipe } from "../crafting-data";
import { addNodeUtilization, buildTreeNode } from "../main-script";

type TreeNodeBase = {
    material: string;
    amount: number;
    children: TreeNode[];
    isRaw: boolean;
    cycleDetected: boolean;
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

type BuildTreeOptions = {
    recipes: Recipe[];
    extractionRecipes: Record<string, ExtractionRecipe>;
    recipeChoices: Map<string, number>;
    materialAvailability: Record<string, number>;
    targetMaterial: string;
};

export function buildCraftingTree(options: BuildTreeOptions): CraftingTree {
    const rawMaterials = {};

    const root = buildTreeNode(
        options.targetMaterial,
        undefined,
        new Set(),
        rawMaterials
    );

    // Store utilization as a decimal:
    // 1 = 100%, 0.5 = 50%, etc.
    if (root.duration > 0) {
        addNodeUtilization(root, root.duration);
    }

    const extractorRequirements = [];

    for (const [material, amount] of Object.entries(rawMaterials)) {
        if (!(typeof amount === "number")) {
            continue;
        }
        const extraction = options.extractionRecipes[material];

        if (!extraction || !root.duration) {
            continue;
        }

        const availability = options.materialAvailability[material] || 5;
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