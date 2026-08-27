import type { ExtractionRecipe, Recipe } from "../crafting-data";
import { buildTreeNode } from "../main-script";

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
): CraftingTree {
    const rawMaterials = {};

    const root = buildTreeNode(
        targetMaterial,
        undefined,
        new Set(),
        rawMaterials
    );

    if (root.duration > 0) {
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