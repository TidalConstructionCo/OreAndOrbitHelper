import { describe, expect, it } from 'vitest';
import {
  buildTree,
  CraftingTree,
  RecipeChoices,
  selectProducingRecipe,
  selectRecipe,
  TreePath,
} from './craftingTree';
import { Material, Recipe } from '../../api-access';

function createDummyMaterial(
  options: { id: string | undefined } | undefined = undefined,
): Material {
  return {
    buy: null,
    category: '',
    icon: '',
    id: options?.id ?? 'MyID',
    mass_kg: 0,
    name: 'My Name',
    sell: null,
    tier: 0,
    volume_m3: 0,
  };
}

function createDummyRecipe(options: { output: { material: Material; qty: number } }): Recipe {
  return {
    alt_of: null,
    batch_minutes: 0,
    building: '',
    byproduct: null,
    era: '',
    id: 'RecipeId',
    inputs: [],
    output: { material: options.output.material.id, qty: options.output.qty },
    planet_gate: null,
    research: null,
    schematic: false,
    tier: 0,
    workforce: '',
  };
}

describe('buildTree', () => {
  it('builds tree with one node when there are no recipes', () => {
    const targetMaterial: Material = createDummyMaterial();
    const expected: CraftingTree = {
      root: {
        amount: 1,
        children: [],
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
