import type { Building, Material, Recipe } from '../gameData';

export function createDummyMaterial(options?: { id: string | undefined }): Material {
  return {
    buyPrice: undefined,
    iconUrl: '',
    id: options?.id ?? 'MyID',
    name: 'My Name',
    sellPrice: undefined,
  };
}

function createDummyBuilding(): Building {
  return {
    iconUrl: '',
    id: 'BuildingID',
    name: 'MyBuilding',
    powerDrawMw: 0,
  };
}

export function createDummyRecipe(options: {
  inputs?: { material: Material; amount: number }[];
  output: { material: Material; amount: number };
  duration?: number;
}): Recipe {
  return {
    duration: options.duration ?? 0,
    building: createDummyBuilding(),
    byproduct: undefined,
    id: 'RecipeId',
    inputs:
      options.inputs?.map((input) => {
        return { material: input.material, amount: input.amount };
      }) ?? [],
    output: { material: options.output.material, amount: options.output.amount },
  };
}
