import { Material, Recipe } from '../../api-access';

type TreeNodeBase = {
  path: TreePath;
  targetAmount: number;
};

export type CraftingTree = {
  root: TreeNode;
};

export type RawMaterialNode = TreeNodeBase & {
  targetMaterial: Material;
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
  targetMaterial: Material;
  totalCycles: number;
  totalDuration: number;
  utilization: number;
};

export type TreeNode = RawMaterialNode | RecipeNode;

/**
 * Has the form Material1>Material2>...>MaterialN.
 */
export type TreePath = string;

export type RecipeChoices = Map<TreePath, Recipe>;

export function buildTree(
  targetMaterial: Material,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
): CraftingTree {
  const path: TreePath = targetMaterial.id;
  const root = createRootNode(
    targetMaterial,
    1,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    path,
  );

  return { root };
}

function createRootNode(
  targetMaterial: Material,
  targetAmount: number,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  currentPath: TreePath,
): TreeNode {
  const recipe = selectProducingRecipe(
    targetMaterial,
    availableRecipes,
    recipeChoices,
    currentPath,
  );
  if (!recipe) {
    return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
  }

  const rootDuration = recipe.batch_minutes;
  return createRecipeNode(
    currentPath,
    recipe,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    targetAmount,
    targetMaterial,
    rootDuration,
  );
}

function createTreeNodeRecursive(
  targetMaterial: Material,
  targetAmount: number,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
  currentPath: TreePath,
  rootDurationMinutes: number,
): TreeNode {
  const recipe = selectProducingRecipe(
    targetMaterial,
    availableRecipes,
    recipeChoices,
    currentPath,
  );
  if (!recipe) {
    return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
  }

  return createRecipeNode(
    currentPath,
    recipe,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    targetAmount,
    targetMaterial,
    rootDurationMinutes,
  );
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
): RecipeNode {
  const outputAmount =
    recipe.byproduct && recipe.byproduct.material === targetMaterial.id
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
      if (!material) {
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
      (recipe.byproduct && recipe.byproduct.material == material.id),
  );
}

function selectRecipe(
  path: TreePath,
  recipes: Recipe[],
  choices: RecipeChoices,
): Recipe | undefined {
  const choice = choices.get(path);
  if (choice && recipes.includes(choice)) {
    return choice;
  }
  return recipes[0];
}
