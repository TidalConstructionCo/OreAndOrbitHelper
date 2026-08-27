import GAME_DATA from "./crafting-data";
const recipes = GAME_DATA.recipes;
import { initialize as initializeApiKeyPage } from "./api-key.js";
import { renderCraftingTree } from "./ui/crafting-tree";
import { buildCraftingTree } from "./domain/crafting-tree";
import { AppState, createInitialState } from "./app/state";
import { renderSummary } from "./ui/summary";
import { initializeToolTabs } from "./ui/tool-tabs";
import { initializeTargetSelector } from "./ui/target-selector";
import { renderExtractorSettings } from "./ui/extractor-settings";

const state = createInitialState();

export function render() {
    if (state.selectedTarget) {
        const treeElement = document.getElementById("tree");
        const tree = buildCraftingTree(
            GAME_DATA.extractionRecipes,
            state.materialAvailability,
            state.selectedTarget,
            // TODO: how to avoid passing state
            state,
            recipes
        );
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

function initialize() {
    initializeToolTabs();
    initializeApiKeyPage();

    const targetSelect = document.querySelector<HTMLSelectElement>("#target-select");
    if (targetSelect) {
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

    const searchInput = document.querySelector<HTMLInputElement>("#tree-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            state.searchText = searchInput.value;
            render();
        });
    }

    const extractorSettings =
        document.querySelector<HTMLElement>(".extractor-settings");
    if (extractorSettings) {
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