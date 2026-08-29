import type { Recipe } from '../crafting-data';

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
