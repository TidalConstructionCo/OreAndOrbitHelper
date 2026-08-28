export interface MaterialAmount {
    material: string;
    amount: number;
}

export interface Recipe {
    name: string;
    duration: number;
    inputs: MaterialAmount[];
    outputs: MaterialAmount[];
}

export interface ExtractionRecipe {
    amount: number;
    duration: number;
}

interface GameData {
    materials: string[];
    recipes: Recipe[];
    extractionRecipes: Record<string, ExtractionRecipe>;
}

const GAME_DATA: GameData = {
    materials: [
        "Structural Frame",
        "Silica Sand",
        "Steel",
        "Steel Plate",
        "Steel Beam",
        "Rare Earth Ore",
        "Copper Ore",
        "Power Distributor",
        "Mining Head",
        "Iron Ingot",
        "Iron Ore",
        "Hydraulic Actuator",
        "Copper Ingot",
        "Aluminium Ore",
        "Aluminium Ingot",
        "Extractor Kit",
        "Electric Motor",
        "Carbon Ore",
        "Bearing Assembly",
        "Alloy Plate",
        "Lubricant",
        "Polymer Housing",
        "Polymer Resin",
        "Hydrogen",
        "Copper Wire",
        "Circuit Board",
        "Insulation",
        "Water",
        "Sulphur",
        "Industrial Acid",
        "Silicon",
        "Ceramic Powder",
        "Fuel Cell",
        "Magnet Assembly",
        "Rare Earth Concentrate",
        "Textile",
        "Saline Brine"
    ],

    recipes: [
        {
            name: "Recipe 1",
            duration: 360,
            inputs: [
                { material: "Mining Head", amount: 2 },
                { material: "Structural Frame", amount: 2 },
                { material: "Power Distributor", amount: 1 },
                { material: "Hydraulic Actuator", amount: 4 }
            ],
            outputs: [
                { material: "Extractor Kit", amount: 1 }
            ]
        },

        {
            name: "Recipe 2",
            duration: 125,
            inputs: [
                { material: "Steel Plate", amount: 4 },
                { material: "Hydraulic Actuator", amount: 2 },
                { material: "Electric Motor", amount: 2 },
                { material: "Bearing Assembly", amount: 4 }
            ],
            outputs: [
                { material: "Mining Head", amount: 1 }
            ]
        },

        {
            name: "Recipe 3",
            duration: 30,
            inputs: [
                { material: "Steel", amount: 4 }
            ],
            outputs: [
                { material: "Steel Beam", amount: 3 }
            ]
        },

        {
            name: "Recipe 4",
            duration: 25,
            inputs: [
                { material: "Steel", amount: 3 }
            ],
            outputs: [
                { material: "Steel Plate", amount: 4 }
            ]
        },

        {
            name: "Recipe 5",
            duration: 100,
            inputs: [
                { material: "Steel Beam", amount: 6 },
                { material: "Steel Plate", amount: 5 }
            ],
            outputs: [
                { material: "Structural Frame", amount: 2 }
            ]
        },

        {
            name: "Recipe 6",
            duration: 90,
            inputs: [
                { material: "Steel Beam", amount: 4 },
                { material: "Alloy Plate", amount: 2 }
            ],
            outputs: [
                { material: "Structural Frame", amount: 2 }
            ]
        },

        {
            name: "Recipe 7",
            duration: 30,
            inputs: [
                { material: "Iron Ingot", amount: 3 },
                { material: "Carbon Ore", amount: 1 }
            ],
            outputs: [
                { material: "Steel", amount: 3 }
            ]
        },

        {
            name: "Recipe 8",
            duration: 52,
            inputs: [
                { material: "Steel Plate", amount: 2 },
                { material: "Lubricant", amount: 1 },
                { material: "Polymer Housing", amount: 1 },
                { material: "Bearing Assembly", amount: 1 }
            ],
            outputs: [
                { material: "Hydraulic Actuator", amount: 2 }
            ]
        },

        {
            name: "Recipe 9",
            duration: 30,
            inputs: [
                { material: "Steel", amount: 2 },
                { material: "Lubricant", amount: 1 }
            ],
            outputs: [
                { material: "Bearing Assembly", amount: 4 }
            ]
        },

        {
            name: "Recipe 10",
            duration: 22,
            inputs: [
                { material: "Polymer Resin", amount: 3 }
            ],
            outputs: [
                { material: "Polymer Housing", amount: 5 }
            ]
        },

        {
            name: "Recipe 11",
            duration: 28,
            inputs: [
                { material: "Carbon Ore", amount: 3 },
                { material: "Hydrogen", amount: 2 }
            ],
            outputs: [
                { material: "Polymer Resin", amount: 5 }
            ]
        },

        {
            name: "Recipe 12",
            duration: 18,
            inputs: [
                { material: "Polymer Resin", amount: 1 },
                { material: "Carbon Ore", amount: 1 }
            ],
            outputs: [
                { material: "Lubricant", amount: 2 }
            ]
        },

        {
            name: "Recipe 13",
            duration: 20,
            inputs: [
                { material: "Iron Ore", amount: 5 }
            ],
            outputs: [
                { material: "Iron Ingot", amount: 2 }
            ]
        },

        {
            name: "Recipe 14",
            duration: 100,
            inputs: [
                { material: "Copper Wire", amount: 6 },
                { material: "Circuit Board", amount: 2 },
                { material: "Insulation", amount: 2 },
                { material: "Fuel Cell", amount: 1 }
            ],
            outputs: [
                { material: "Power Distributor", amount: 2 }
            ]
        },

        {
            name: "Recipe 15",
            duration: 60,
            inputs: [
                { material: "Copper Wire", amount: 4 },
                { material: "Steel Plate", amount: 1 },
                { material: "Magnet Assembly", amount: 1 },
                { material: "Bearing Assembly", amount: 2 }
            ],
            outputs: [
                { material: "Electric Motor", amount: 2 }
            ]
        },

        {
            name: "Recipe 16",
            duration: 42,
            inputs: [
                { material: "Rare Earth Concentrate", amount: 2 },
                { material: "Iron Ingot", amount: 1 }
            ],
            outputs: [
                { material: "Magnet Assembly", amount: 3 }
            ]
        },

        {
            name: "Recipe 17",
            duration: 20,
            inputs: [
                { material: "Copper Ingot", amount: 2 }
            ],
            outputs: [
                { material: "Copper Wire", amount: 6 }
            ]
        },

        {
            name: "Recipe 18",
            duration: 20,
            inputs: [
                { material: "Polymer Housing", amount: 1 },
                { material: "Rare Earth Concentrate", amount: 1 },
                { material: "Industrial Acid", amount: 1 }
            ],
            outputs: [
                { material: "Fuel Cell", amount: 3 }
            ]
        },

        {
            name: "Recipe 19",
            duration: 45,
            inputs: [
                { material: "Silicon", amount: 2 },
                { material: "Copper Wire", amount: 3 },
                { material: "Polymer Resin", amount: 1 }
            ],
            outputs: [
                { material: "Circuit Board", amount: 4 }
            ]
        },

        {
            name: "Recipe 20",
            duration: 50,
            inputs: [
                { material: "Silicon", amount: 2 },
                { material: "Copper Wire", amount: 2 },
                { material: "Ceramic Powder", amount: 1 }
            ],
            outputs: [
                { material: "Circuit Board", amount: 3 }
            ]
        },

        {
            name: "Recipe 21",
            duration: 28,
            inputs: [
                { material: "Polymer Resin", amount: 2 },
                { material: "Ceramic Powder", amount: 1 }
            ],
            outputs: [
                { material: "Insulation", amount: 5 }
            ]
        },

        {
            name: "Recipe 22",
            duration: 26,
            inputs: [
                { material: "Ceramic Powder", amount: 2 },
                { material: "Textile", amount: 1 }
            ],
            outputs: [
                { material: "Insulation", amount: 4 }
            ]
        },

        {
            name: "Recipe 23",
            duration: 25,
            inputs: [
                { material: "Silica Sand", amount: 2 }
            ],
            outputs: [
                { material: "Silicon", amount: 2 }
            ]
        },

        {
            name: "Recipe 24",
            duration: 45,
            inputs: [
                { material: "Rare Earth Ore", amount: 6 }
            ],
            outputs: [
                { material: "Rare Earth Concentrate", amount: 1 }
            ]
        },

        {
            name: "Recipe 25",
            duration: 28,
            inputs: [
                { material: "Silica Sand", amount: 4 },
                { material: "Saline Brine", amount: 1 }
            ],
            outputs: [
                { material: "Ceramic Powder", amount: 2 }
            ]
        },

        {
            name: "Recipe 26",
            duration: 22,
            inputs: [
                { material: "Water", amount: 1 },
                { material: "Saline Brine", amount: 4 }
            ],
            outputs: [
                { material: "Industrial Acid", amount: 3 }
            ]
        },

        {
            name: "Recipe 27",
            duration: 16,
            inputs: [
                { material: "Saline Brine", amount: 6 }
            ],
            outputs: [
                { material: "Water", amount: 5 }
            ]
        },

        {
            name: "Recipe 28",
            duration: 22,
            inputs: [
                { material: "Copper Ore", amount: 5 }
            ],
            outputs: [
                { material: "Copper Ingot", amount: 2 }
            ]
        },

        {
            name: "Recipe 29",
            duration: 40,
            inputs: [
                { material: "Aluminium Ingot", amount: 3 },
                { material: "Rare Earth Concentrate", amount: 1 }
            ],
            outputs: [
                { material: "Alloy Plate", amount: 3 }
            ]
        },

        {
            name: "Recipe 30",
            duration: 35,
            inputs: [
                { material: "Aluminium Ore", amount: 6 }
            ],
            outputs: [
                { material: "Aluminium Ingot", amount: 2 }
            ]
        },
        {
            name: "Recipe 31",
            duration: 24,
            inputs: [
                { material: "Silica Sand", amount: 3 },
                { material: "Aluminium Ore", amount: 2 }
            ],
            outputs: [
                { material: "Ceramic Powder", amount: 3 }
            ]
        }
    ],

    extractionRecipes: {
        "Iron Ore": {
            amount: 2,
            duration: 16
        },

        "Carbon Ore": {
            amount: 2,
            duration: 18
        },

        "Hydrogen": {
            amount: 2,
            duration: 31
        },

        "Copper Ore": {
            amount: 2,
            duration: 24
        },

        "Rare Earth Ore": {
            amount: 5,
            duration: 180
        },

        "Silica Sand": {
            amount: 2,
            duration: 10
        },

        "Saline Brine": {
            amount: 2,
            duration: 13
        }
    }
};

export default GAME_DATA;