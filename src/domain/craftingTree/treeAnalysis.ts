import { Recipe } from '../../api-access';
import { CraftingTree, RecipeNode, TreeNode } from './craftingTree';

/**
 * Returns the amount of crafting cycles required to produce the target amount.
 *
 * May be a fraction.
 */
export function getRequiredCycles(node: RecipeNode): number {
  return node.targetAmount / node.outputAmount;
}

/**
 * Returns the active time for the recipe in minutes.
 *
 * The active time is the fraction or multiple of the recipe time required to produce the target amount.
 */
export function getActiveTimeMinutes(node: RecipeNode): number {
  return node.durationPerCycle * getRequiredCycles(node);
}

export type RecipeUtilization = Map<Recipe, number>;
export function getSummedUtilization(tree: CraftingTree): RecipeUtilization {
  const utilization: RecipeUtilization = new Map();
  const node = tree.root;
  if (node.kind === 'rawMaterial') {
    return utilization;
  }
  recurseUtilization(node.durationPerCycle, node, utilization);
  return utilization;
}

function recurseUtilization(rootDuration: number, node: TreeNode, utilization: RecipeUtilization) {
  if (node.kind === 'rawMaterial') {
    return;
  }

  const nextUtilization = getActiveTimeMinutes(node) / rootDuration;
  const currentUtilization = utilization.get(node.recipe);
  utilization.set(
    node.recipe,
    currentUtilization ? currentUtilization + nextUtilization : nextUtilization,
  );

  for (const child of node.children) {
    recurseUtilization(rootDuration, child, utilization);
  }
}
