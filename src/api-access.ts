import { getApiKey } from "./api-key";

const baseUri = "https://oreandorbit.com/api/v1/";

import { z } from "zod";

const MaterialSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    tier: z.number(),
    mass_kg: z.number(),
    volume_m3: z.number(),
    icon: z.string().url(),
    buy: z.number(),
    sell: z.number(),
});

const MaterialsResponseSchema = z.object({
    data: z.array(MaterialSchema),
});

export type Material = z.infer<typeof MaterialSchema>;
export type MaterialsResponse = z.infer<
    typeof MaterialsResponseSchema
>;


export async function getMaterials(): Promise<MaterialsResponse | undefined> {
    const apiKey = getApiKey();
    if (apiKey === undefined) {
        return undefined;
    }


    const response = await fetch(
        `{baseUri}materials`,
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
            },
        }
    );

    if (!response.ok) {
        // throw new Error(`Request failed: ${response.status}`);
        console.log(`Failed to fetch materials: ${response.status} ${response.statusText}`);
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