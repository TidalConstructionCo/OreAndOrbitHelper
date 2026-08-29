import z from 'zod';

export const CACHE_KEYS = {
  materials: 'cache-materials',
  recipes: 'cache-recipes',
  locations: 'cache-locations',
} as const;

type CachedValue<T> = {
  timestamp: number;
  data: T;
};

function createCachedValueSchema<T>(dataSchema: z.ZodType<T>): z.ZodType<CachedValue<T>> {
  return z.object({
    timestamp: z.number(),
    data: dataSchema,
  });
}

export function saveToCache<T>(key: string, data: T): void {
  const value = {
    timestamp: Date.now(),
    data,
  };

  localStorage.setItem(key, JSON.stringify(value));
}

export function loadCache<T>(key: string, dataSchema: z.ZodType<T>): CachedValue<T> | undefined {
  // console.log(`Loading ${key}`);
  const stored = localStorage.getItem(key);

  if (!stored) {
    console.log(`Not found.`);
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    const cacheSchema = createCachedValueSchema(dataSchema);
    const result = cacheSchema.safeParse(parsed);
    // console.log(`Loading ${key}`);

    if (!result.success) {
      // console.log(`Parsing failed: ${JSON.stringify(result.error)}`);
      localStorage.removeItem(key);
      return undefined;
    }

    // console.log(`Loaded ${JSON.stringify(result.data)}`);
    return result.data;
  } catch {
    localStorage.removeItem(key);
    return undefined;
  }
}
