export type AppState = {
    selectedTarget: string;
    searchText: string;
    recipeChoices: Map<string, number>;
    materialAvailability: Record<string, number>;
};

export function createInitialState(): AppState {
    return {
        selectedTarget: "Extractor Kit",
        searchText: "",
        recipeChoices: new Map(),
        materialAvailability: {
            "Iron Ore": 5,
            "Carbon Ore": 5,
            "Hydrogen": 5,
            "Copper Ore": 5,
            "Rare Earth Ore": 5,
            "Silica Sand": 5,
            "Saline Brine": 5,
        },
    };
}
