import GAME_DATA from "./crafting-data";
import { initialize as initializeApiKeyPage } from "./api-key.js";
import { renderCraftingTree } from "./ui/crafting-tree";
import { buildCraftingTree } from "./domain/crafting-tree";
import { createInitialState } from "./app/state";
import { renderSummary } from "./ui/summary";
import { initializeToolTabs } from "./ui/tool-tabs";
import { initializeTargetSelector } from "./ui/target-selector";
import { renderExtractorSettings } from "./ui/extractor-settings";
import { getMaterials, getRecipes } from "./api-access";

const state = createInitialState();

export function render() {
    if (state.selectedTarget) {
        const treeElement = document.getElementById("tree");
        const tree = buildCraftingTree(
            GAME_DATA.extractionRecipes,
            state.materialAvailability,
            state.selectedTarget,
            state,
            GAME_DATA.recipes
        );

        console.log({
            selectedTarget: state.selectedTarget,
            recipeCount: GAME_DATA.recipes.length,
            recipes: GAME_DATA.recipes,
            tree
        });

        if (treeElement) {
            renderCraftingTree({
                treeElement,
                rootNode: tree.root,
                recipeChoices: state.recipeChoices,
                searchText: state.searchText,
                recipes: GAME_DATA.recipes,
                onRecipeChoiceChanged: (material, recipeIndex) => {
                    state.recipeChoices.set(material, recipeIndex);
                    render();
                }
            });
        }

        const summary = document.getElementById("summary");
        if (summary) {
            renderSummary(tree, summary);
        }
    }
}

function initializeTargetSelect(): void {
    const targetSelect = document.querySelector<HTMLSelectElement>("#target-select");
    if (!targetSelect) {
        return;
    }

    initializeTargetSelector({
        select: targetSelect,
        materials: GAME_DATA.materials,
        selectedTarget: state.selectedTarget,
        onTargetChanged: target => {
            state.selectedTarget = target;
            render();
        },
    });
}

function initializeExtractorSettings(): void {
    const extractorSettings =
        document.querySelector<HTMLElement>(".extractor-settings");
    if (!extractorSettings) {
        return;
    }

    renderExtractorSettings({
        container: extractorSettings,
        materials: Object.keys(state.materialAvailability),
        availability: state.materialAvailability,
        onAvailabilityChanged: (material, value) => {
            state.materialAvailability[material] = value;
            render();
        }
    });
}

function refreshAllDisplays(): void {
    if (!GAME_DATA.materials.includes(state.selectedTarget)) {
        state.selectedTarget = GAME_DATA.materials[0] ?? "";
    }

    initializeTargetSelect();
    initializeExtractorSettings();
    render();
}

function initialize() {
    initializeToolTabs();
    initializeApiKeyPage();

    // TODO: rename
    const updateMaterialsButton =
        document.querySelector<HTMLButtonElement>(
            "#reload-game-data"
        );

    if (updateMaterialsButton) {
        updateMaterialsButton.addEventListener("click", async () => {
            updateMaterialsButton.disabled = true;

            try {
                // TODO: maybe return if the update was successful
                await updateGameData();
                refreshAllDisplays();
            } finally {
                updateMaterialsButton.disabled = false;
            }
        });
    }

    initializeTargetSelect();

    const searchInput = document.querySelector<HTMLInputElement>("#tree-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            state.searchText = searchInput.value;
            render();
        });
    }

    initializeExtractorSettings();

    let resizeTimer: number | undefined;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            render();
        }, 100);
    });


    render();
}

initialize();

async function updateGameData() {
    // TODO: fix extractor
    // TODO: fix display name of materials
    const materialApiResult = await getMaterials();
    if (materialApiResult) {
        // TODO: set cache
        GAME_DATA.materials = materialApiResult.data.map(r => r.id);
        // GAME_DATA.materials = materialApiResult.data.map(r => r.name);
        alert(GAME_DATA.materials);
    }
    else {
        alert("failed");
    }

    const recipeApiResult = await getRecipes();
    if (recipeApiResult) {
        // TODO: set cache
        GAME_DATA.recipes = recipeApiResult.data.map(r => {
            const inputs = r.inputs.map(i => { return { material: i.material, amount: i.qty }; });
            const outputs = [{ material: r.output.material, amount: r.output.qty }];
            const byproduct = r.byproduct;
            if (byproduct) {
                outputs.push({ material: byproduct.material, amount: byproduct.qty });
            }
            return {
                inputs,
                outputs,
                duration: r.batch_minutes,
                name: r.id,
            };
        });
        alert(GAME_DATA.recipes);
        console.table(
            GAME_DATA.recipes.map(recipe => ({
                name: recipe.name,
                inputs: JSON.stringify(recipe.inputs),
                outputs: JSON.stringify(recipe.outputs),
                duration: recipe.duration
            }))
        );
    }
    else {
        alert("failed");
    }

    // export interface Recipe {
    //     name: string;
    //     duration: number;
    //     inputs: MaterialAmount[];
    //     outputs: MaterialAmount[];
    // }

    //     export interface MaterialAmount {
    //     material: string;
    //     amount: number;
    // }

    // const materialApiResult = await getMaterials();
    // if (materialApiResult) {
    //     // TODO: set cache
    //     GAME_DATA.materials = materialApiResult.data.map(r => r.name);
    //     alert(GAME_DATA.materials);
    // }
    // else {
    //     alert("failed");
    // }
}
