import { describe, expect, it } from 'vitest';
import { buildTree, CraftingTree, TreePath } from './craftingTree';
import { Material, Recipe } from '../api-access';

function createDummyMaterial(): Material {
  return {
    buy: null,
    category: '',
    icon: '',
    id: 'MyID',
    mass_kg: 0,
    name: 'MY Name',
    sell: null,
    tier: 0,
    volume_m3: 0,
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
