import { Material, Recipe } from '../../api-access';

type TreeNodeBase = {
  path: MaterialId[];
  targetAmount: number;
};

export type CraftingTree = {
  root: TreeNode;
};

export type RawMaterialNode = TreeNodeBase & {
  material: Material;
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

// TODO: collect type helpers somewhere
type PropertyType<T, K extends keyof T> = T[K];

type MaterialId = PropertyType<Material, 'id'>;

export type TreePath = MaterialId[];

// TODO: possibly problematic due to array identity => options? Worst case, fall back to string via concatenation
export type RecipeChoices = Map<TreePath, Recipe>;

export function buildTree(
  targetMaterial: Material,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
): CraftingTree {
  const path: TreePath = [targetMaterial.id];
  const root = createTreeNode(
    targetMaterial,
    1,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    path,
  );

  return { root };
}

function createTreeNode(
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

  return createRecipeNode(
    currentPath,
    recipe,
    availableMaterials,
    availableRecipes,
    recipeChoices,
    targetAmount,
    targetMaterial,
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
    material: material,
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
): RecipeNode {
  const node: RecipeNode = {
    kind: 'recipe',
    recipe: recipe,
    path: path,
    durationPerCycle: recipe.batch_minutes,
    outputAmount:
      // TODO: fix
      recipe.byproduct && recipe.byproduct.material === 'TODO: add id'
        ? recipe.byproduct.qty
        : recipe.output.qty,
    targetAmount: targetAmount,
    // TODO: fix utilization
    utilization: 0,
    recipeChoices: getProducingRecipes(targetMaterial, availableRecipes),
    targetMaterial,
    // TODO: fix cycles
    totalCycles: 1,
    // TODO: fix duration
    totalDuration: 1,
    children: recipe.inputs.flatMap((input) => {
      const material = availableMaterials.find((material) => input.material === material.id);
      if (!material) {
        return [];
      }
      return [
        createTreeNode(material, input.qty, availableMaterials, availableRecipes, recipeChoices, [
          ...path,
          material.id,
        ]),
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
