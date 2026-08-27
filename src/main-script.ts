import GAME_DATA from "./crafting-data";
const materials = GAME_DATA.materials;
const recipes = GAME_DATA.recipes;
import { initialize as initializeApiKeyPage } from "./api-key.js";
import { renderCraftingTree } from "./ui/crafting-tree";
import { buildCraftingTree } from "./domain/crafting-tree";
import { AppState, createInitialState } from "./app/state";
import { renderSummary } from "./ui/summary";

const state = createInitialState();

function updateMaterialAvailability(state: AppState) {
    for (const [material, availability] of Object.entries(
        state.materialAvailability
    )) {
        const id = material
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const output = document.getElementById(`${id}-value`);

        if (output) {
            output.textContent = String(availability);
        }
    }
}

function recipesProducing(material) {
    return recipes.filter(recipe =>
        recipe.outputs.some(output => output.material === material)
    );
}

function getSelectedRecipe(state: AppState, material) {
    const choices = recipesProducing(material);

    if (choices.length === 0) {
        return null;
    }

    const selectedIndex = state.recipeChoices.get(material) ?? 0;
    return choices[selectedIndex] ?? choices[0];
}

function getOutput(recipe, material) {
    return recipe.outputs.find(output => output.material === material);
}

export function buildTreeNode(
    targetMaterial,
    requiredAmount: number | undefined,
    visited,
    rawMaterials
): TreeNode {
    const recipe = getSelectedRecipe(state, targetMaterial);

    // No crafting recipe: this is a raw material.
    if (!recipe) {
        const amount = requiredAmount ?? 1;

        rawMaterials[targetMaterial] =
            (rawMaterials[targetMaterial] ?? 0) + amount;

        return {
            material: targetMaterial,
            amount,
            cycles: null,
            duration: null,
            children: [],
            isRaw: true,
            cycleDetected: false
        };
    }

    // Prevent recursive recipes from causing infinite recursion.
    if (visited.has(targetMaterial)) {
        return {
            material: targetMaterial,
            amount: requiredAmount ?? 0,
            cycles: null,
            duration: null,
            children: [],
            isRaw: false,
            cycleDetected: true
        };
    }

    const output = getOutput(recipe, targetMaterial);

    let cycles;
    let amount;

    if (requiredAmount == null) {
        // The root represents one complete recipe cycle.
        cycles = 1;
        amount = output.amount;
    } else {
        amount = requiredAmount;
        cycles = requiredAmount / output.amount;
    }

    const node = {
        material: targetMaterial,
        amount,
        cycles,
        duration: recipe.duration * cycles,
        recipe,
        children: [],
        isRaw: false,
        cycleDetected: false
    };


    const nextVisited = new Set(visited);
    nextVisited.add(targetMaterial);

    for (const ingredient of recipe.inputs) {
        const childAmount = ingredient.amount * cycles;

        node.children.push(
            buildTreeNode(
                ingredient.material,
                childAmount,
                nextVisited,
                rawMaterials
            )
        );
    }

    return node;
}
function createExtractorSettings(state: AppState) {
    for (const [material, availability] of Object.entries(state.materialAvailability)) {
        const id = material
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        const wrapper = document.createElement("div");
        wrapper.className = "extractor-setting";

        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = `${material}`;

        const input = document.createElement("input");
        input.type = "range";
        input.id = id;
        input.name = material;
        input.min = "1";
        input.max = "10";
        input.step = "1";
        input.value = availability;

        const output = document.createElement("output");
        output.id = `${id}-value`;
        output.textContent = availability;

        input.addEventListener("input", (event) => {
            const value = Number(event.target.value);

            state.materialAvailability[material] = value;
            output.textContent = value;

            render();
        });

        wrapper.append(label, input, output);

        document.querySelector(".extractor-settings").appendChild(wrapper);
    }
}

export function render() {
    if (state.selectedTarget) {
        const treeElement = document.getElementById("tree");
        const tree = buildCraftingTree(
            GAME_DATA.extractionRecipes,
            state.materialAvailability,
            state.selectedTarget,
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
    updateMaterialAvailability(state);
}

function initialize() {
    initializeApiKeyPage();
    const targetSelect = document.getElementById("target-select");
    const searchInput = document.getElementById("tree-search");

    for (const material of materials) {
        const option = document.createElement("option");
        option.value = material;
        option.textContent = material;
        targetSelect.appendChild(option);
    }

    targetSelect.value = state.selectedTarget;

    targetSelect.addEventListener("change", event => {
        state.selectedTarget = event.target.value;
        render();
    });

    searchInput.addEventListener("input", event => {
        state.searchText = event.target.value;
        render();
    });

    let resizeTimer;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            render();
        }, 100);
    });


    createExtractorSettings(state);
    render();

    // console.log("Getting materials");
    // const materials1 = getMaterials();
    // if (materials1 !== undefined) {
    //     console.log("Got materials");
    //     console.log(materials1);
    // }
}

const toolButtons = document.querySelectorAll(".tool-button");
const toolPanels = document.querySelectorAll(".tool-panel");

toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedTool = button.dataset.tool;

        toolButtons.forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        toolPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.id === selectedTool);
        });
    });
});


initialize();