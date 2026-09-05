import { describe, expect, it } from 'vitest';
import type { CraftingTree, RecipeChoices, RecipeNode, TreePath } from './craftingTree';
import { buildTree, selectProducingRecipe } from './craftingTree';
import type { Material, Recipe } from '../../api-access';
import { createDummyMaterial, createDummyRecipe } from './treeTestUtils';

describe('buildTree', () => {
  it('builds tree with one node when there are no recipes', () => {
    const targetMaterial: Material = createDummyMaterial();
    const expected: CraftingTree = {
      root: {
        targetAmount: 1,
        kind: 'rawMaterial',
        targetMaterial: targetMaterial,
        path: targetMaterial.id,
        hasCraftingRecipe: false,
      },
    };
    expect(buildTree(targetMaterial, [], [], [], new Map<TreePath, Recipe>(), [], [], [])).toEqual(
      expected,
    );
  });
  it('turns sourced input into sourced node', () => {
    // arrange
    const targetMaterial: Material = createDummyMaterial({ id: 'targetMaterial' });
    const intermediateMaterial: Material = createDummyMaterial({ id: 'intermediateMaterial' });
    const rawMaterial1: Material = createDummyMaterial({ id: 'rawMaterial1' });
    const rawMaterial2: Material = createDummyMaterial({ id: 'rawMaterial2' });
    const recipe1 = createDummyRecipe({
      output: { material: targetMaterial, qty: 1 },
      duration: 30,
      inputs: [
        { material: rawMaterial1, qty: 1 },
        { material: intermediateMaterial, qty: 5 },
      ],
    });
    const recipe2 = createDummyRecipe({
      output: { material: intermediateMaterial, qty: 10 },
      duration: 30,
      inputs: [
        { material: rawMaterial1, qty: 2 },
        { material: rawMaterial2, qty: 3 },
      ],
    });

    // act
    const actual = buildTree(
      targetMaterial,
      [targetMaterial, rawMaterial1, rawMaterial2, intermediateMaterial],
      [recipe1, recipe2],
      [],
      new Map<TreePath, Recipe>(),
      [intermediateMaterial],
      [],
      [],
    );

    // assert
    // TODO: can I write this better?
    const root = actual.root as RecipeNode;
    const intermediateMaterialNode = root.children[1];
    console.log(JSON.stringify(intermediateMaterialNode));
    expect(intermediateMaterialNode?.kind).toEqual('sourced');
  });
  it('overrides extraction with recipe when forced', () => {
    // arrange
    const targetMaterial: Material = createDummyMaterial({ id: 'targetMaterial' });
    const intermediateMaterial: Material = createDummyMaterial({ id: 'intermediateMaterial' });
    const rawMaterial1: Material = createDummyMaterial({ id: 'rawMaterial1' });
    const rawMaterial2: Material = createDummyMaterial({ id: 'rawMaterial2' });
    const recipe1 = createDummyRecipe({
      output: { material: targetMaterial, qty: 1 },
      duration: 30,
      inputs: [
        { material: rawMaterial1, qty: 1 },
        { material: intermediateMaterial, qty: 5 },
      ],
    });
    const recipe2 = createDummyRecipe({
      output: { material: intermediateMaterial, qty: 10 },
      duration: 30,
      inputs: [
        { material: rawMaterial1, qty: 2 },
        { material: rawMaterial2, qty: 3 },
      ],
    });

    // act
    const actual = buildTree(
      targetMaterial,
      [targetMaterial, rawMaterial1, rawMaterial2, intermediateMaterial],
      [recipe1, recipe2],
      [intermediateMaterial.id],
      new Map<TreePath, Recipe>(),
      [],
      [`${targetMaterial.id}>${intermediateMaterial.id}`],
      [],
    );

    // assert
    const root = actual.root as RecipeNode;
    const intermediateMaterialNode = root.children[1];
    expect(intermediateMaterialNode?.kind).toEqual('recipe');
  });
});

describe('selectProducingRecipe', () => {
  it('returns undefined when there are no recipes', () => {
    // arrange
    const recipeChoices: RecipeChoices = new Map<TreePath, Recipe>();
    const targetMaterial = createDummyMaterial();
    const availableRecipes: Recipe[] = [];
    const path: TreePath = targetMaterial.id;

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
    const path: TreePath = targetMaterial.id;

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
    const path: TreePath = targetMaterial.id;

    // act
    const actual = selectProducingRecipe(targetMaterial, availableRecipes, recipeChoices, path);
    const expected: Recipe = targetRecipe;

    // assert
    expect(actual).toBe(expected);
  });
});
