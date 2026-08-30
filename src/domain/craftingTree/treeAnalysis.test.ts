import { describe, expect, it } from 'vitest';
import { buildTree } from './craftingTree';
import { getSummedUtilization, RecipeUtilization } from './treeAnalysis';
import { createDummyMaterial, createDummyRecipe } from './treeTestUtils';

// TODO: should be easier
describe('getSummedUtilization', () => {
  it('calculates utilization', () => {
    // arrange
    const targetMaterial = createDummyMaterial({ id: 'targetId' });
    const inputMaterial = createDummyMaterial({ id: 'inputId' });
    const rawMaterial = createDummyMaterial({ id: 'rawId' });
    const inputMaterialRecipe = createDummyRecipe({
      duration: 50,
      inputs: [{ material: rawMaterial, qty: 1 }],
      output: { material: inputMaterial, qty: 2 },
    });
    const mainRecipe = createDummyRecipe({
      duration: 100,
      inputs: [{ material: inputMaterial, qty: 1 }],
      output: { material: targetMaterial, qty: 1 },
    });
    const tree = buildTree(
      targetMaterial,
      [targetMaterial, inputMaterial, rawMaterial],
      [inputMaterialRecipe, mainRecipe],
      new Map(),
    );

    // act
    const actual = getSummedUtilization(tree);

    // assert
    const expected: RecipeUtilization = new Map();
    expected.set(mainRecipe, 1);
    expected.set(inputMaterialRecipe, 1 / 4);
    console.log(JSON.stringify(tree));
    expect(actual).toEqual(expected);
  });
});
