import type {
  Material as MaterialData,
  Building as BuildingData,
  Recipe as RecipeData,
  Extraction,
} from '../api-access';
export type MaterialId = string;
export type Material = {
  id: MaterialId;
  name: string;
  iconUrl: string;
  buyPrice: number | undefined;
  sellPrice: number | undefined;
};

// TODO: use these types instead of the zod types
export function convertMaterial(data: MaterialData): Material {
  return {
    id: data.id,
    name: data.name,
    iconUrl: data.icon,
    buyPrice: data.buy !== null ? data.buy : undefined,
    sellPrice: data.sell !== null ? data.sell : undefined,
  };
}

export type BuildingId = string;
export type Building = {
  id: BuildingId;
  name: string;
  iconUrl: string;
  powerDrawMw: number;
};

export function convertBuilding(data: BuildingData): Building {
  return {
    id: data.id,
    name: data.name,
    iconUrl: data.icon,
    powerDrawMw: data.power_draw_mw,
  };
}

export type MaterialAmount = {
  material: Material;
  amount: number;
};

export type RecipeId = string;
export type Recipe = {
  id: RecipeId;
  inputs: MaterialAmount[];
  // TODO: maybe merge amount and byproduct somehow?
  output: MaterialAmount;
  byproduct: MaterialAmount | undefined;
  duration: number;
  building: Building;
};

// TODO: coudl define like this
// export type Outputs = [output: MaterialAmount, byproduct?: MaterialAmount];

export function tryConvertRecipe(
  data: RecipeData,
  availableMaterials: Material[],
  availableBuildings: Building[],
): Recipe | undefined {
  const inputs: MaterialAmount[] = [];
  for (const input of data.inputs) {
    const materialAmount = convertMaterialAmount(input, availableMaterials);
    if (materialAmount === undefined) {
      // TODO: log error?
      return undefined;
    }
    inputs.push(materialAmount);
  }

  const output = convertMaterialAmount(data.output, availableMaterials);
  if (output === undefined) {
    // TODO: log Error
    return undefined;
  }

  // TODO
  const building = availableBuildings.find((b) => b.id === data.building);
  if (building === undefined) {
    // TODO: log?
    return undefined;
  }

  const byproduct =
    data.byproduct === null ? null : convertMaterialAmount(data.byproduct, availableMaterials);

  return {
    id: data.id,
    inputs: inputs,
    output: output,
    byproduct: byproduct === null ? undefined : byproduct,
    building: building,
    duration: data.batch_minutes,
  };
}

function convertMaterialAmount(
  data: { material: string; qty: number },
  availableMaterials: Material[],
): MaterialAmount | undefined {
  const material = availableMaterials.find((m) => m.id === data.material);
  return material === undefined ? undefined : { amount: data.qty, material: material };
}

export type ExtractionRecipe = {
  duration: number;
  amount: number;
  material: Material;
};

export function tryConvertExtractionRecipe(
  data: Extraction,
  availableMaterials: Material[],
): ExtractionRecipe | undefined {
  const material = availableMaterials.find((m) => m.id === data.material);
  if (material === undefined) {
    return undefined;
  }

  return {
    duration: data.batch_minutes,
    amount: data.units_per_batch,
    material: material,
  };
}
