import z from "zod";

const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 min
export const CACHE_KEYS = {
    materials: "cache-materials",
    recipes: "cache-recipes",
    locations: "cache-locations",
} as const;

type CachedValue<T> = {
    timestamp: number;
    data: T;
};

function createCachedValueSchema<T>(
    dataSchema: z.ZodType<T>
): z.ZodType<CachedValue<T>> {
    return z.object({
        timestamp: z.number(),
        data: dataSchema,
    });
}

export function saveToCache<T>(key: string, data: T): void {
    const value = {
        timestamp: Date.now(),
        data,
    }

    localStorage.setItem(key, JSON.stringify(value));
}

export function loadCache<T>(
    key: string,
    dataSchema: z.ZodType<T>
): CachedValue<T> | undefined {
    const stored = localStorage.getItem(key);

    if (!stored) {
        return undefined;
    }

    try {
        const parsed: unknown = JSON.parse(stored);

        const cacheSchema = createCachedValueSchema(dataSchema);
        const result = cacheSchema.safeParse(parsed);

        if (!result.success) {
            localStorage.removeItem(key);
            return undefined;
        }

        const cache = result.data;
    } catch {
        localStorage.removeItem(key);
        return undefined;
    }
}

export function isExpired<T>(cacheItem: CachedValue<T>) {
    return Date.now() - cacheItem.timestamp >= CACHE_DURATION_MS;
}