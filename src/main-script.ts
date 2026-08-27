import GAME_DATA from "./crafting-data";
const materials = GAME_DATA.materials;
const recipes = GAME_DATA.recipes;
import { initialize as initializeApiKeyPage } from "./api-key.js";
import { renderCraftingTree } from "./ui/crafting-tree";
import { buildCraftingTree } from "./domain/crafting-tree";
import { AppState, createInitialState } from "./app/state";
const state = createInitialState();
// TODO: remove
export const materialAvailability = state.materialAvailability;




function formatRecipe(recipe) {
    const inputs = recipe.inputs
        .map(input =>
            `${formatAmount(input.amount)}x ${input.material}`
        )
        .join(" + ");

    const outputs = recipe.outputs
        .map(output =>
            `${formatAmount(output.amount)}x ${output.material}`
        )
        .join(" + ");

    return `[${inputs}] => [${outputs}]`;
}


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

function formatAmount(amount) {
    if (Number.isInteger(amount)) {
        return String(amount);
    }

    return amount
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}

function recipesProducing(material) {
    return recipes.filter(recipe =>
        recipe.outputs.some(output => output.material === material)
    );
}

function getSelectedRecipe(material) {
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

function formatPercent(value) {
    if (value == null) {
        return "";
    }

    return `${formatAmount(value * 100)}%`;
}



export function buildTreeNode(
    targetMaterial,
    requiredAmount: number | undefined,
    visited,
    rawMaterials
): TreeNode {
    const recipe = getSelectedRecipe(targetMaterial);

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



function summedRecipeUtilization(rootNode) {
    const totals = new Map();

    function visit(node) {
        if (
            !node.isRaw &&
            !node.cycleDetected &&
            node.recipe &&
            node.utilization != null
        ) {
            const current = totals.get(node.recipe) ?? 0;
            totals.set(node.recipe, current + node.utilization);
        }

        for (const child of node.children) {
            visit(child);
        }
    }

    visit(rootNode);
    return totals;
}


function renderSummary(tree) {
    const summary = document.getElementById("summary");
    summary.replaceChildren();

    const rawPanel = document.createElement("div");
    rawPanel.className = "panel";

    const rawTitle = document.createElement("h2");
    rawTitle.textContent = "Raw materials per crafting cycle";
    rawPanel.appendChild(rawTitle);

    const rawList = document.createElement("ul");

    for (const [material, amount] of Object.entries(tree.rawMaterials)) {
        const item = document.createElement("li");
        item.textContent =
            `${formatAmount(amount)}x ${material}`;
        rawList.appendChild(item);
    }

    if (rawList.children.length === 0) {
        const item = document.createElement("li");
        item.className = "muted";
        item.textContent = "None";
        rawList.appendChild(item);
    }

    rawPanel.appendChild(rawList);
    summary.appendChild(rawPanel);

    // New recipe utilization panel
    const utilizationPanel = document.createElement("div");
    utilizationPanel.className = "panel";

    const utilizationTitle = document.createElement("h2");
    utilizationTitle.textContent =
        "Summed recipe utilization";
    utilizationPanel.appendChild(utilizationTitle);

    const utilizationList = document.createElement("ul");
    const recipeTotals = summedRecipeUtilization(tree.root);

    for (const [recipe, utilization] of recipeTotals) {
        const item = document.createElement("li");

        item.textContent =
            `${formatPercent(utilization)}: ${formatRecipe(recipe)}`;


        utilizationList.appendChild(item);
    }

    if (utilizationList.children.length === 0) {
        const item = document.createElement("li");
        item.className = "muted";
        item.textContent = "None";
        utilizationList.appendChild(item);
    }

    utilizationPanel.appendChild(utilizationList);
    summary.appendChild(utilizationPanel);

    const extractorPanel = document.createElement("div");
    extractorPanel.className = "panel";

    const extractorTitle = document.createElement("h2");
    extractorTitle.textContent =
        `Extractors needed to supply one ${tree.root.material} chain permanently`;
    extractorPanel.appendChild(extractorTitle);

    const extractorList = document.createElement("ul");

    for (const requirement of tree.extractorRequirements) {
        const item = document.createElement("li");
        item.textContent =
            `${formatAmount(requirement.extractors)}x ` +
            `${requirement.material} extractor`;
        extractorList.appendChild(item);
    }

    if (extractorList.children.length === 0) {
        const item = document.createElement("li");
        item.className = "muted";
        item.textContent = "None";
        extractorList.appendChild(item);
    }

    extractorPanel.appendChild(extractorList);
    summary.appendChild(extractorPanel);
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

        renderSummary(tree);
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