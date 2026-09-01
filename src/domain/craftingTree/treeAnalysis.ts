import { Extraction, Material, Recipe } from '../../api-access';
import { GameData, MaterialId } from '../../app/newState';
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

// TODO: test?
export function getSummedRawItems(tree: CraftingTree): Map<Material, number> {
  const result: Map<Material, number> = new Map();
  const remainingNodes = [tree.root];
  while (remainingNodes.length > 0) {
    const currentNode = remainingNodes.pop()!;
    const kind = currentNode.kind;
    switch (kind) {
      case 'rawMaterial': {
        result.set(
          currentNode.targetMaterial,
          (result.get(currentNode.targetMaterial) ?? 0) + currentNode.targetAmount,
        );
        break;
      }
      case 'recipe': {
        remainingNodes.push(...currentNode.children);
        break;
      }
      default: {
        const exhaustiveCheck: never = kind;
        throw new Error(`Unsupported kind ${exhaustiveCheck}`);
      }
    }
  }
  return result;
}

// TODO: move somewhere more fitting? Pass materials in instead of tree to reduce cost?
export function getExtractorRequirements(
  tree: CraftingTree,
  extractionRecipes: Extraction[],
  // rootDuration: number,
  // TODO: maybe use map instead? idk?
  extractionYields: Record<MaterialId, number>,
  // TODO: add extraction sliders
): Map<Material, number> {
  const rawMaterials = getSummedRawItems(tree);
  const result: Map<Material, number> = new Map();
  if (tree.root.kind !== 'recipe') {
    // TODO
    const extractionRecipe = extractionRecipes.find(
      (r) => r.material === tree.root.targetMaterial.id,
    );
    if (extractionRecipe) {
      result.set(
        tree.root.targetMaterial,
        tree.root.targetAmount / extractionRecipe.units_per_batch,
      );
    }
    return result;
  }
  for (const [material, amount] of rawMaterials) {
    const extractionRecipe = extractionRecipes.find((r) => r.material === material.id);
    if (extractionRecipe) {
      const availability = extractionYields[material.id] || 5;
      const availabilityModifier = availability * 0.16 + 0.2;

      result.set(
        material,
        (result.get(material) ?? 0) +
          getRequiredExtractors(
            amount,
            extractionRecipe.batch_minutes,
            extractionRecipe.units_per_batch,
            availabilityModifier,
            tree.root.totalDuration,
          ),
      );
    }
  }
  return result;
}

function getRequiredExtractors(
  materialAmount: number,
  cycleDurationMinutes: number,
  unitsPerBatch: number,
  availabilityModifier: number,
  productionTimeMinutes: number,
): number {
  const extractionCycles =
    (materialAmount * cycleDurationMinutes) /
    (unitsPerBatch * availabilityModifier * productionTimeMinutes);
  return Math.ceil(extractionCycles * 1000) / 1000;
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
