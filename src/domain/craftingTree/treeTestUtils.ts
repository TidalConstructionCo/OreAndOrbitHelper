import type { Recipe } from '../../api-access';
import type { Material } from '../gameData';

export function createDummyMaterial(options?: { id: string | undefined }): Material {
  return {
    buyPrice: undefined,
    iconUrl: '',
    id: options?.id ?? 'MyID',
    name: 'My Name',
    sellPrice: undefined,
  };
}

export function createDummyRecipe(options: {
  inputs?: { material: Material; qty: number }[];
  output: { material: Material; qty: number };
  duration?: number;
}): Recipe {
  return {
    alt_of: null,
    batch_minutes: options.duration ?? 0,
    building: '',
    byproduct: null,
    era: '',
    id: 'RecipeId',
    inputs:
      options.inputs?.map((input) => {
        return { material: input.material.id, qty: input.qty };
      }) ?? [],
    output: { material: options.output.material.id, qty: options.output.qty },
    planet_gate: null,
    research: null,
    schematic: false,
    tier: 0,
    workforce: '',
  };
}
