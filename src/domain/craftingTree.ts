import { Material, Recipe } from '../api-access';

type TreeNodeBase = {
  children: TreeNode[];
  path: MaterialId[];
};

export type CraftingTree = {
  root: TreeNode;
};

type RawMaterialNode = TreeNodeBase & { material: Material; amount: number; kind: 'rawMaterial' };
type RecipeNode = TreeNodeBase & { kind: 'recipe' };

type TreeNode = RawMaterialNode | RecipeNode;

// TODO: collect type helpers somewhere
type PropertyType<T, K extends keyof T> = T[K];

type MaterialId = PropertyType<Material, 'id'>;

export type TreePath = MaterialId[];

// TODO: possibly problematic due to array identity => options? Worst case, fall back to string via concatenation
type RecipeChoices = Map<TreePath, Recipe>;

export function buildTree(
  targetMaterial: Material,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
): CraftingTree {
  // TODO: fill
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
  const recipeCandidates = getProducingRecipes(targetMaterial, availableRecipes);
  const recipe = selectRecipe(currentPath, recipeCandidates, recipeChoices);

  if (!recipe) {
    return createRawMaterialNode(currentPath, targetMaterial, targetAmount);
  }

  return createRecipeNode(currentPath, recipe, availableMaterials, availableRecipes, recipeChoices);
}

function createRawMaterialNode(
  path: TreePath,
  material: Material,
  amount: number,
): RawMaterialNode {
  return { kind: 'rawMaterial', children: [], path: path, material: material, amount: amount };
}

// todo: test
function createRecipeNode(
  path: TreePath,
  recipe: Recipe,
  availableMaterials: Material[],
  availableRecipes: Recipe[],
  recipeChoices: RecipeChoices,
): RecipeNode {
  const node: RecipeNode = {
    kind: 'recipe',
    path: path,
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
  if (choice) {
    return choice;
  }
  return recipes[0];
}
