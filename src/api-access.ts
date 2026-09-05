import { getApiKey } from './api-key';

const baseUri = 'https://oreandorbit.com/api/v1/';

import { z } from 'zod';

const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  tier: z.number(),
  mass_kg: z.number(),
  volume_m3: z.number(),
  icon: z.url(),
  buy: z.number().nullable(),
  sell: z.number().nullable(),
});

export const MaterialsResponseSchema = z.object({
  data: z.array(MaterialSchema),
});

export type Material = z.infer<typeof MaterialSchema>;

export type MaterialsResponse = z.infer<typeof MaterialsResponseSchema>;

const ExtractionBoosterSchema = z.object({
  per_day: z.number(),
  material: z.string(),
  yield_bonus: z.number(),
});

const ExtractionSchema = z.object({
  material: z.string(),
  type: z.string(),
  trait: z.string(),
  building: z.string(),
  units_per_batch: z.number(),
  batch_minutes: z.number(),
  required_per_day: z.record(z.string(), z.number()),
  booster: ExtractionBoosterSchema.nullable(),
  research: z.string().nullable(),
});

export const ExtractionResponseSchema = z.object({
  data: z.array(ExtractionSchema),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
// export type ExtractionBooster = z.infer<typeof ExtractionBoosterSchema>;
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

const RecipeMaterialSchema = z.object({
  qty: z.number(),
  material: z.string(),
});

const RecipeOutputSchema = z.object({
  material: z.string(),
  qty: z.number(),
});

const RecipeSchema = z.object({
  id: z.string(),
  output: RecipeOutputSchema,
  inputs: z.array(RecipeMaterialSchema),
  byproduct: RecipeOutputSchema.nullable(),
  batch_minutes: z.number(),
  building: z.string(),
  workforce: z.string(),
  tier: z.number(),
  era: z.string(),
  alt_of: z.string().nullable(),
  planet_gate: z.string().nullable(),
  research: z.string().nullable(),
  schematic: z.boolean(),
});

export const RecipesResponseSchema = z.object({
  data: z.array(RecipeSchema),
});

// type RecipeOutput = z.infer<typeof RecipeOutputSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipesResponse = z.infer<typeof RecipesResponseSchema>;

export async function getMaterials(): Promise<MaterialsResponse | undefined> {
  const apiKey = getApiKey();
  if (apiKey === undefined) {
    return undefined;
  }

  const response = await fetch(`${baseUri}materials`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.log(`Failed to fetch materials: ${String(response.status)} ${response.statusText}`);
    return undefined;
  }

  const materials: unknown = await response.json();

  const result = MaterialsResponseSchema.safeParse(materials);
  if (!result.success) {
    console.log(result.error.issues);
    return undefined;
  }
  return result.data;
}

export async function getRecipes(): Promise<RecipesResponse | undefined> {
  const apiKey = getApiKey();
  if (apiKey === undefined) {
    return undefined;
  }

  const response = await fetch(`${baseUri}recipes`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.log(`Failed to fetch recipes: ${String(response.status)} ${response.statusText}`);
    return undefined;
  }

  const recipes: unknown = await response.json();

  const result = RecipesResponseSchema.safeParse(recipes);
  if (!result.success) {
    console.log(result.error.issues);
    return undefined;
  }
  return result.data;
}

export async function getExtraction(): Promise<ExtractionResponse | undefined> {
  const apiKey = getApiKey();
  if (apiKey === undefined) {
    return undefined;
  }

  const response = await fetch(`${baseUri}extraction`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.log(`Failed to fetch recipes: ${String(response.status)} ${response.statusText}`);
    return undefined;
  }

  const recipes: unknown = await response.json();

  const result = ExtractionResponseSchema.safeParse(recipes);
  if (!result.success) {
    console.log(result.error.issues);
    return undefined;
  }
  return result.data;
}

export const BuildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.url(),
  power_draw_mw: z.number(),
  research: z.string().nullable(),
});

export const BuildingsResponseSchema = z.object({
  data: z.array(BuildingSchema),
});

export type Building = z.infer<typeof BuildingSchema>;
export type BuildingsResponse = z.infer<typeof BuildingsResponseSchema>;

export async function getBuildingData(): Promise<BuildingsResponse | undefined> {
  const apiKey = getApiKey();
  if (apiKey === undefined) {
    return undefined;
  }

  const response = await fetch(`${baseUri}buildings`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.log(`Failed to fetch buildings: ${String(response.status)} ${response.statusText}`);
    return undefined;
  }

  const recipes: unknown = await response.json();

  const result = BuildingsResponseSchema.safeParse(recipes);
  if (!result.success) {
    console.log(result.error.issues);
    return undefined;
  }
  return result.data;
}
