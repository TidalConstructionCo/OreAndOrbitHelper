import { Material, Recipe as NewRecipe, RecipeOutput } from '../api-access';
import { AppState as NewState } from '../app/newState';

type TreeNodeBaseNew = {
  material: Material;
  amount: number;
  children: TreeNodeNew[];
  isRaw: boolean;
  cycleDetected: boolean;

  // Store utilization as a decimal:
  // 1 = 100%, 0.5 = 50%, etc.
  utilization: number | null;
};

type RecipeTreeNodeNew = TreeNodeBaseNew & {
  isRaw: false;
  cycles: number;
  duration: number;
  recipe: NewRecipe;
};

type RawTreeNodeNew = TreeNodeBaseNew & {
  isRaw: true;
  cycles: null;
  duration: null;
  recipe?: never;
};

export type TreeNodeNew = RecipeTreeNodeNew | RawTreeNodeNew;

export type ExtractorRequirement = {
  material: string;
  amount: number;
  extractors: number;
  extractionCyclesPerExtractor: number;
  extractionDuration: number;
};

export type CraftingTreeNew = {
  root: TreeNodeNew;
  rawMaterials: Record<string, number>;
  extractorRequirements: ExtractorRequirement[];
};

function buildTreeNodeNew(
  targetMaterial: Material,
  requiredAmount: number | undefined,
  visited: Set<Material>,
  // TODO: raw materials is an aggregate, maybe build separately / in a later step?
  rawMaterials: Record<string, number>,
  state: NewState,
  recipes: NewRecipe[],
): TreeNodeNew {
  const recipe = getSelectedRecipeNew(targetMaterial, recipes);

  // No crafting recipe: this is a raw material.
  if (!recipe) {
    const amount = requiredAmount ?? 1;

    rawMaterials[targetMaterial.id] = (rawMaterials[targetMaterial.id] ?? 0) + amount;
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
    amount = output.qty;
  } else {
    amount = requiredAmount;
    cycles = requiredAmount / output.qty;
  }

  const node: RecipeTreeNodeNew = {
    material: targetMaterial,
    amount,
    cycles,
    duration: recipe.batch_minutes * cycles,
    recipe,
    children: [],
    isRaw: false,
    cycleDetected: false,
    utilization: null,
  };

  const nextVisited = new Set(visited);
  nextVisited.add(targetMaterial);

  for (const ingredient of recipe.inputs) {
    const childAmount = ingredient.qty * cycles;

    const newIngredient = state.gameData.materialData.data.find(
      (m) => m.id === ingredient.material,
    );
    if (newIngredient) {
      // TODO: else error, or improve types and parameters
      node.children.push(
        buildTreeNodeNew(newIngredient, childAmount, nextVisited, rawMaterials, state, recipes),
      );
    }
  }

  return node;
}

export function buildCraftingTreeNew(state: NewState): CraftingTreeNew | undefined {
  const rawMaterials: Record<string, number> = {};

  const targetMaterial = state.craftingTree.targetMaterial;
  const extractionRecipes = state.gameData.extractionData.data;
  const materialAvailability = state.craftingTree.extractionYields;
  if (!targetMaterial) {
    // TODO: error
    return undefined;
  }

  const root = buildTreeNodeNew(
    targetMaterial,
    undefined,
    new Set(),
    rawMaterials,
    state,
    state.gameData.recipeData.data,
  );

  const totalDuration = root.duration;
  if (totalDuration && totalDuration > 0) {
    addNodeUtilization(root, totalDuration);
  }

  const extractorRequirements: ExtractorRequirement[] = [];
  for (const [material, amount] of Object.entries(rawMaterials)) {
    const extractionRecipe = extractionRecipes.find((e) => e.material === material);

    if (!extractionRecipe || !totalDuration) {
      continue;
    }

    const availability = materialAvailability[material] || 5;
    const availabilityModifier = availability * 0.16 + 0.2;

    const extractionCycles =
      (amount * extractionRecipe.batch_minutes) /
      (extractionRecipe.units_per_batch * availabilityModifier * totalDuration);

    const extractors = Math.ceil(extractionCycles * 1000) / 1000;

    extractorRequirements.push({
      material,
      amount,
      extractors,
      extractionCyclesPerExtractor: extractionCycles,
      extractionDuration: extractionRecipe.batch_minutes,
    });
  }

  return {
    root,
    rawMaterials,
    extractorRequirements,
  };
}

function getSelectedRecipeNew(material: Material, recipes: NewRecipe[]): NewRecipe | undefined {
  const choices = recipes.filter(
    (recipe) =>
      recipe.output.material === material.id ||
      (recipe.byproduct && recipe.byproduct.material === material.id),
  );

  if (choices.length === 0) {
    return undefined;
  }

  // TODO: currently lost the ability to choose between recipes
  // That should probably be part of state
  return choices[0];
}

function getOutput(recipe: NewRecipe, material: Material): RecipeOutput {
  if (recipe.byproduct && recipe.byproduct.material === material.id) {
    return recipe.byproduct;
  }
  return recipe.output;
}

function addNodeUtilization(node: TreeNodeNew, totalDuration: number) {
  if (node.duration != null && totalDuration > 0) {
    node.utilization = node.duration / totalDuration;
  } else {
    node.utilization = null;
  }

  for (const child of node.children) {
    addNodeUtilization(child, totalDuration);
  }
}
