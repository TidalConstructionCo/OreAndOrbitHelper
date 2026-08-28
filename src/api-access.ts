import { getApiKey } from './api-key'

const baseUri = 'https://oreandorbit.com/api/v1/'

import { z } from 'zod'

const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  tier: z.number(),
  mass_kg: z.number(),
  volume_m3: z.number(),
  icon: z.string().url(),
  buy: z.number().nullable(),
  sell: z.number().nullable(),
})

export const MaterialsResponseSchema = z.object({
  data: z.array(MaterialSchema),
})

export type Material = z.infer<typeof MaterialSchema>

export type MaterialsResponse = z.infer<typeof MaterialsResponseSchema>

const ExtractionBoosterSchema = z.object({
  per_day: z.number(),
  material: z.string(),
  yield_bonus: z.number(),
})

export const ExtractionSchema = z.object({
  material: z.string(),
  type: z.string(),
  trait: z.string(),
  building: z.string(),
  units_per_batch: z.number(),
  batch_minutes: z.number(),
  required_per_day: z.record(z.string(), z.number()),
  booster: ExtractionBoosterSchema.nullable(),
  research: z.string().nullable(),
})

export const ExtractionResponseSchema = z.object({
  data: z.array(ExtractionSchema),
})

export type Extraction = z.infer<typeof ExtractionSchema>
export type ExtractionBooster = z.infer<typeof ExtractionBoosterSchema>
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>

const RecipeMaterialSchema = z.object({
  qty: z.number(),
  material: z.string(),
})

const RecipeOutputSchema = z.object({
  material: z.string(),
  qty: z.number(),
})

export const RecipeSchema = z.object({
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
})

export const RecipesResponseSchema = z.object({
  data: z.array(RecipeSchema),
})

export type RecipeMaterial = z.infer<typeof RecipeMaterialSchema>
export type RecipeOutput = z.infer<typeof RecipeOutputSchema>
export type Recipe = z.infer<typeof RecipeSchema>
export type RecipesResponse = z.infer<typeof RecipesResponseSchema>

// TODO:
// 1) get the other data
// 2) cache it
// 3) do time stuff
// decide whether to cache the 3 things separately (or at least materials)?

const CacheSchema = z.object({
  timestamp: z.number(),
  materials: MaterialsResponseSchema.optional(),
  extraction: ExtractionBoosterSchema.optional(),
  recipes: RecipesResponseSchema.optional(),
})

type Cache = z.infer<typeof CacheSchema>

// function readCache(): Cache {
//   const stored = localStorage.getItem(CACHE_KEY);

//   if (!stored) {
//     return {
//       timestamp: 0,
//     };
//   }

//   try {
//     const parsed: unknown = JSON.parse(stored);
//     const result = CacheSchema.safeParse(parsed);

//     if (!result.success) {
//       localStorage.removeItem(CACHE_KEY);

//       return {
//         timestamp: 0,
//       };
//     }

//     return result.data;
//   } catch {
//     localStorage.removeItem(CACHE_KEY);

//     return {
//       timestamp: 0,
//     };
//   }
// }

// function writeCache(cache: Cache): void {
//   localStorage.setItem(
//     CACHE_KEY,
//     JSON.stringify(cache)
//   );
// }

// function isCacheFresh(timestamp: number): boolean {
//   return Date.now() - timestamp < CACHE_DURATION_MS;
// }

export async function getMaterials(): Promise<MaterialsResponse | undefined> {
  const apiKey = getApiKey()
  if (apiKey === undefined) {
    return undefined
  }

  const response = await fetch(`${baseUri}materials`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    // throw new Error(`Request failed: ${response.status}`);
    console.log(`Failed to fetch materials: ${response.status} ${response.statusText}`)
    return undefined
  }

  const materials: unknown = await response.json()
  // console.log(materials);

  const result = MaterialsResponseSchema.safeParse(materials)
  if (!result.success) {
    console.log(result.error.issues)
    return undefined
  }
  return result.data
}

export async function getRecipes(): Promise<RecipesResponse | undefined> {
  const apiKey = getApiKey()
  if (apiKey === undefined) {
    return undefined
  }

  const response = await fetch(`${baseUri}recipes`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    // throw new Error(`Request failed: ${response.status}`);
    console.log(`Failed to fetch recipes: ${response.status} ${response.statusText}`)
    return undefined
  }

  const recipes: unknown = await response.json()
  // console.log(materials);

  const result = RecipesResponseSchema.safeParse(recipes)
  if (!result.success) {
    console.log(result.error.issues)
    return undefined
  }
  return result.data
}

export async function getExtraction(): Promise<ExtractionResponse | undefined> {
  const apiKey = getApiKey()
  if (apiKey === undefined) {
    return undefined
  }

  const response = await fetch(`${baseUri}extraction`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    console.log(`Failed to fetch recipes: ${response.status} ${response.statusText}`)
    return undefined
  }

  const recipes: unknown = await response.json()
  // console.log(materials);

  const result = ExtractionResponseSchema.safeParse(recipes)
  if (!result.success) {
    console.log(result.error.issues)
    return undefined
  }
  return result.data
}
