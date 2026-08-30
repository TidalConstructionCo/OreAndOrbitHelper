import { describe, expect, it } from 'vitest';
import {
  buildTree,
  CraftingTree,
  RecipeChoices,
  selectProducingRecipe,
  TreePath,
} from './craftingTree';
import { Material, Recipe } from '../../api-access';
import { createDummyMaterial, createDummyRecipe } from './treeTestUtils';

describe('buildTree', () => {
  it('builds tree with one node when there are no recipes', () => {
    const targetMaterial: Material = createDummyMaterial();
    const expected: CraftingTree = {
      root: {
        targetAmount: 1,
        kind: 'rawMaterial',
        material: targetMaterial,
        path: [targetMaterial.id],
      },
    };
    expect(buildTree(targetMaterial, [], [], new Map<TreePath, Recipe>())).toEqual(expected);
  });
});

describe('selectProducingRecipe', () => {
  it('returns undefined when there are no recipes', () => {
    // arrange
    const recipeChoices: RecipeChoices = new Map<TreePath, Recipe>();
    const targetMaterial = createDummyMaterial();
    const availableRecipes: Recipe[] = [];
    const path: TreePath = [targetMaterial.id];

    // act
    const actual = selectProducingRecipe(targetMaterial, availableRecipes, recipeChoices, path);

    // assert
    expect(actual).toBeUndefined();
  });
  it('returns undefined when there are no recipes producing the material', () => {
    // arrange
    const recipeChoices: RecipeChoices = new Map<TreePath, Recipe>();
    const targetMaterial = createDummyMaterial({ id: 'target' });
    const unrelatedMaterial = createDummyMaterial({ id: 'unrelated' });
    const availableRecipes: Recipe[] = [
      createDummyRecipe({ output: { material: unrelatedMaterial, qty: 1 } }),
    ];
    const path: TreePath = [targetMaterial.id];

    // act
    const actual = selectProducingRecipe(targetMaterial, availableRecipes, recipeChoices, path);

    // assert
    expect(actual).toBeUndefined();
  });

  it('returns the first matching recipe when there are recipes producing the material', () => {
    // arrange
    const recipeChoices: RecipeChoices = new Map<TreePath, Recipe>();
    const targetMaterial = createDummyMaterial({ id: 'target' });
    const targetRecipe = createDummyRecipe({ output: { material: targetMaterial, qty: 1 } });
    const otherMatchingRecipe = createDummyRecipe({ output: { material: targetMaterial, qty: 2 } });
    const availableRecipes: Recipe[] = [targetRecipe, otherMatchingRecipe];
    const path: TreePath = [targetMaterial.id];

    // act
    const actual = selectProducingRecipe(targetMaterial, availableRecipes, recipeChoices, path);
    const expected: Recipe = targetRecipe;

    // assert
    expect(actual).toBe(expected);
  });
});
