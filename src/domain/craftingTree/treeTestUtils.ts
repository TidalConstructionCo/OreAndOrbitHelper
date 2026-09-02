import { Material, Recipe } from '../../api-access';

export function createDummyMaterial(
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
