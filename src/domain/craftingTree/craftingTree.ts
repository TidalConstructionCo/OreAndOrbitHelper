// import type { Force } from 'd3';
import type { Material, Recipe } from '../../api-access';
import type { MaterialId } from '../../app/state';

type TreeNodeBase = {
  path: TreePath;
  targetAmount: number;
  targetMaterial: Material;
};

export type CraftingTree = {
  root: TreeNode;
};

export type RawMaterialNode = TreeNodeBase & {
  kind: 'rawMaterial';
};

// TODO: maybe directly save the derived info instead of output amount etc?
export type RecipeNode = TreeNodeBase & {
  kind: 'recipe';
  durationPerCycle: number;
  outputAmount: number;
  recipe: Recipe;
  recipeChoices: Recipe[];
  children: TreeNode[];
  totalCycles: number;
  totalDuration: number;
  utilization: number;
};

export type SourcedNode = TreeNodeBase & {
  kind: 'sourced';
};

export type TreeNode = RawMaterialNode | RecipeNode | SourcedNode;

/**
 * Has the form Material1>Material2>...>MaterialN.
 */
export type TreePath = string;

export type RecipeChoices = Map<TreePath, Recipe>;
// TODO: this should technically also check if there even exists an extraction recipe
export type ForcedRecipe = TreePath[];

// TODO: many parameters, wrap into some type
export function buildTree(
  targetMaterial: Material,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  // TODO: a) add test b) store "hasExtractionRecipe/hasCraftingRecipe" on node c) render extraction toggle
  // TODO 2: if there'S an extraction recipe, that should be the default (not recipe)
  extractableMaterials: MaterialId[],
  recipeChoices: RecipeChoices,
  sourcedMaterials: Material[],
  recipeOverrides: ForcedRecipe,
): CraftingTree {
  const path: TreePath = targetMaterial.id;
  const root = createRootNode(
    targetMaterial,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    path,
    sourcedMaterials,
    recipeOverrides,
    extractableMaterials,
  );

  return { root };
}

function createSourcedNode(
  currentPath: TreePath,
  targetAmount: number,
  targetMaterial: Material,
): SourcedNode {
  return {
    kind: 'sourced',
    path: currentPath,
    targetAmount: targetAmount,
    targetMaterial: targetMaterial,
  };
}

function createRootNode(
  targetMaterial: Material,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  currentPath: TreePath,
  sourcedMaterials: Material[],
  recipeOverrides: ForcedRecipe,
  extractableMaterials: MaterialId[],
): TreeNode {
  if (sourcedMaterials.some((m) => m.id === targetMaterial.id)) {
    return createSourcedNode(currentPath, 1, targetMaterial);
  }
  const recipe = selectProducingRecipe(
    targetMaterial,
    availableRecipes,
    recipeChoices,
    currentPath,
  );
  if (recipeOverrides.includes(currentPath) || recipe === undefined) {
    return createRawMaterialNode(currentPath, targetMaterial, 1);
  }

  const outputQuantity =
    recipe.byproduct?.material === targetMaterial.id ? recipe.byproduct.qty : recipe.output.qty;
  const rootDuration = recipe.batch_minutes;
  return createRecipeNode(
    currentPath,
    recipe,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    outputQuantity,
    targetMaterial,
    rootDuration,
    sourcedMaterials,
    recipeOverrides,
    extractableMaterials,
  );
}

function isSourced(targetMaterialId: string, sourcedMaterials: Material[]): boolean {
  return sourcedMaterials.some((m) => m.id === targetMaterialId);
}

function hasUsableCraftingOverride(
  currentPath: TreePath,
  recipeOverrides: ForcedRecipe,
  recipe: Recipe | undefined,
): boolean {
  return recipeOverrides.includes(currentPath) && recipe !== undefined;
}

function hasExtractionRecipe(materialId: string, extractableMaterials: MaterialId[]): boolean {
  return extractableMaterials.some((m) => m === materialId);
}

function createTreeNodeRecursive(
  targetMaterial: Material,
  targetAmount: number,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  currentPath: TreePath,
  rootDurationMinutes: number,
  sourcedMaterials: Material[],
  recipeOverrides: ForcedRecipe,
  extractableMaterials: MaterialId[],
): TreeNode {
  if (isSourced(targetMaterial.id, sourcedMaterials)) {
    return createSourcedNode(currentPath, targetAmount, targetMaterial);
  }
  const recipe = selectProducingRecipe(
    targetMaterial,
    availableRecipes,
    recipeChoices,
    currentPath,
  );
  if (hasUsableCraftingOverride(currentPath, recipeOverrides, recipe)) {
    return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
  }
  if (hasExtractionRecipe(targetMaterial.id, extractableMaterials)) {
    return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
  }
  if (recipe !== undefined) {
    return createRecipeNode(
      currentPath,
      recipe,
      availableMaterials,
      availableRecipes,
      recipeChoices,
      targetAmount,
      targetMaterial,
      rootDurationMinutes,
      sourcedMaterials,
      recipeOverrides,
      extractableMaterials,
    );
  }
  return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
}

export function selectProducingRecipe(
  targetMaterial: Material,
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  currentPath: TreePath,
): Recipe | undefined {
  const recipeCandidates = getProducingRecipes(targetMaterial, availableRecipes);
  return selectRecipe(currentPath, recipeCandidates, recipeChoices);
}

function createRawMaterialNode(
  path: TreePath,
  material: Material,
  amount: number,
): RawMaterialNode {
  return {
    kind: 'rawMaterial',
    path: path,
    targetMaterial: material,
    targetAmount: amount,
  };
}

function createRecipeNode(
  path: TreePath,
  recipe: Recipe,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  targetAmount: number,
  targetMaterial: Material,
  rootDurationMinutes: number,
  sourcedMaterials: Material[],
  recipeOverrides: ForcedRecipe,
  extractableMaterials: MaterialId[],
): RecipeNode {
  const outputAmount =
    recipe.byproduct !== null && recipe.byproduct.material === targetMaterial.id
      ? recipe.byproduct.qty
      : recipe.output.qty;
  const totalCycles = targetAmount / outputAmount;
  const recipeDurationMinutes = totalCycles * recipe.batch_minutes;
  const utilization = recipeDurationMinutes / rootDurationMinutes;
  const node: RecipeNode = {
    kind: 'recipe',
    recipe: recipe,
    path: path,
    durationPerCycle: recipe.batch_minutes,
    outputAmount: outputAmount,
    targetAmount: targetAmount,
    utilization: utilization,
    recipeChoices: getProducingRecipes(targetMaterial, availableRecipes),
    targetMaterial,
    totalCycles: totalCycles,
    totalDuration: recipeDurationMinutes,
    children: recipe.inputs.flatMap((input) => {
      const material = availableMaterials.find((material) => input.material === material.id);
      if (material === undefined) {
        return [];
      }
      return [
        createTreeNodeRecursive(
          material,
          input.qty,
          availableMaterials,
          availableRecipes,
          recipeChoices,
          `${path}>${material.id}`,
          rootDurationMinutes,
          sourcedMaterials,
          recipeOverrides,
          extractableMaterials,
        ),
      ];
    }),
  };
  return node;
}

function getProducingRecipes(material: Material, recipes: Recipe[]): Recipe[] {
  return recipes.filter(
    (recipe) =>
      recipe.output.material === material.id ||
      (recipe.byproduct !== null && recipe.byproduct.material === material.id),
  );
}

function selectRecipe(
  path: TreePath,
  recipes: Recipe[],
  choices: RecipeChoices,
): Recipe | undefined {
  const choice = choices.get(path);
  if (choice !== undefined && recipes.includes(choice)) {
    return choice;
  }
  return recipes[0];
}
