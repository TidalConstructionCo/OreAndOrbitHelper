const materials = GAME_DATA.materials;
const recipes = GAME_DATA.recipes;
const extractionRecipes = GAME_DATA.extractionRecipes;

const recipeChoices = new Map();
const treeSearch = {
    value: ""
};

const materialAvailability = {
    "Iron Ore": 5,
    "Carbon Ore": 5,
    "Hydrogen": 5,
    "Copper Ore": 5,
    "Rare Earth Ore": 5,
    "Silica Sand": 5,
    "Saline Brine": 5,
};

function addNodeUtilization(node, totalDuration) {
    if (
        node.duration != null &&
        totalDuration > 0
    ) {
        node.utilization = node.duration / totalDuration;
    } else {
        node.utilization = null;
    }

    for (const child of node.children) {
        addNodeUtilization(child, totalDuration);
    }
}

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


function updateMaterialAvailability() {
    for (const [material, availability] of Object.entries(
        materialAvailability
    )) {
        const id = materialToId(material);
        const output = document.getElementById(`${id}-value`);

        if (output) {
            output.textContent = availability;
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

    const selectedIndex = recipeChoices.get(material) ?? 0;
    return choices[selectedIndex] ?? choices[0];
}

function getOutput(recipe, material) {
    return recipe.outputs.find(output => output.material === material);
}

function buildCraftingTree(targetMaterial) {
    const rawMaterials = {};

    const root = buildTreeNode(
        targetMaterial,
        null,
        new Set(),
        rawMaterials
    );

    // Store utilization as a decimal:
    // 1 = 100%, 0.5 = 50%, etc.
    if (root.duration > 0) {
        addNodeUtilization(root, root.duration);
    }

    const extractorRequirements = [];

    for (const [material, amount] of Object.entries(rawMaterials)) {
        const extraction = extractionRecipes[material];

        if (!extraction || !root.duration) {
            continue;
        }

        const availability = materialAvailability[material] || 5;
        const availabilityModifer = availability * 0.16 + 0.2;

        const extractionCycles =
            (amount * extraction.duration) /
            (extraction.amount * availabilityModifer * root.duration);

        const extractors =
            Math.ceil(extractionCycles * 1000) / 1000;

        extractorRequirements.push({
            material,
            amount,
            extractors,
            extractionCyclesPerExtractor: extractionCycles,
            extractionDuration: extraction.duration
        });
    }

    return {
        root,
        rawMaterials,
        extractorRequirements
    };
}

function formatPercent(value) {
    if (value == null) {
        return "";
    }

    return `${formatAmount(value * 100)}%`;
}


function buildTreeNode(
    targetMaterial,
    requiredAmount,
    visited,
    rawMaterials
) {
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
function createExtractorSettings() {
    for (const [material, availability] of Object.entries(materialAvailability)) {
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

            materialAvailability[material] = value;
            output.textContent = value;

            render();
        });

        wrapper.append(label, input, output);

        // const settingsContainer = document.querySelector(".extractor-settings");
        document.querySelector(".extractor-settings").appendChild(wrapper);
    }
}

// function createRecipeSelector(material) {
//     const choices = recipesProducing(material);

//     if (choices.length <= 1) {
//         return null;
//     }

//     const select = document.createElement("select");
//     select.className = "recipe-choice";

//     choices.forEach((recipe, index) => {
//         const option = document.createElement("option");

//         option.value = index;
//         option.textContent =
//             `${recipe.name} — ${recipe.duration} minutes`;

//         select.appendChild(option);
//     });

//     select.value = recipeChoices.get(material) ?? 0;

//     select.addEventListener("change", event => {
//         recipeChoices.set(material, Number(event.target.value));
//         render();
//     });

//     return select;
// }

function getTreeSearchQuery() {
    return treeSearch.value.trim().toLowerCase();
}

function nodeMatchesSearch(node) {
    const query = getTreeSearchQuery();

    if (!query) {
        return false;
    }

    return node.data.material.toLowerCase().includes(query);
}

function renderCraftingTree(rootNode) {
    const treeElement = document.getElementById("tree");
    treeElement.replaceChildren();

    const treeWidth = Math.max(treeElement.clientWidth, 320);
    const treeHeight = Math.max(treeElement.clientHeight, 320);


    const root = d3.hierarchy(rootNode);

    const treeLayout = d3.tree()
        .nodeSize([280, 130])
        .separation((a, b) =>
            a.parent === b.parent ? 1.4 : 2
        );

    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    const minX = d3.min(nodes, node => node.x);
    const maxX = d3.max(nodes, node => node.x);
    const maxY = d3.max(nodes, node => node.y);

    const contentWidth = Math.max(
        treeWidth,
        maxX - minX + 340
    );

    const contentHeight = Math.max(
        treeHeight,
        maxY + 260
    );

    const svg = d3.select(treeElement)
        .append("svg")
        .attr("width", contentWidth)
        .attr("height", contentHeight)
        .attr("viewBox", `0 0 ${contentWidth} ${contentHeight}`);

    const zoomLayer = svg.append("g")
        .attr(
            "transform",
            `translate(${170 - minX}, 80)`
        );



    const zoom = d3.zoom()
        // Allows zooming much farther in and out.
        .scaleExtent([0.15, 8])
        .on("zoom", event => {
            zoomLayer.attr("transform", event.transform);
        });

    svg.call(zoom);


    zoomLayer
        .append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr(
            "d",
            d3.linkVertical()
                .x(node => node.x)
                .y(node => node.y)
        );


    const searchQuery = getTreeSearchQuery();

    const nodeSelection = zoomLayer
        .append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", node => {
            let className;

            if (node.data.cycleDetected) {
                className = "node cycle";
            } else {
                className = node.data.isRaw
                    ? "node raw"
                    : "node crafted";
            }

            if (searchQuery) {
                if (nodeMatchesSearch(node)) {
                    className += " search-match";
                } else {
                    className += " search-dim";
                }
            }

            return className;
        })
        .attr(
            "transform",
            node => `translate(${node.x}, ${node.y})`
        );


    nodeSelection
        .append("rect")
        .attr("x", -120)
        .attr("y", -42)
        .attr("width", 240)
        .attr("height", node => {
            if (node.data.cycleDetected || node.data.isRaw) {
                return 84;
            }

            return getRecipeChoicesCount(node.data.material) > 1
                ? 115
                : 84;
        })
        .attr("rx", 10)
        .attr("ry", 10);

    nodeSelection
        .append("text")
        .attr("class", "material")
        .attr("text-anchor", "middle")
        .attr("y", -16)
        .text(node => {
            if (node.data.cycleDetected) {
                return `${node.data.material} [cycle]`;
            }

            return node.data.material;
        });

    nodeSelection
        .append("text")
        .attr("class", "details")
        .attr("text-anchor", "middle")
        .attr("y", 10)
        .text(node => {
            if (node.data.cycleDetected) {
                return "Recursive recipe";
            }

            if (node.data.isRaw) {
                return `${formatAmount(node.data.amount)}x raw material`;
            }

            return `${formatAmount(node.data.amount)}x · ` +
                `${formatAmount(node.data.cycles)} cycles · ` +
                `${formatAmount(node.data.duration)} min · ` +
                `${formatPercent(node.data.utilization)} utilization`;
        });


    nodeSelection
        .filter(node =>
            !node.data.isRaw &&
            !node.data.cycleDetected &&
            getRecipeChoicesCount(node.data.material) > 1
        )
        .append("foreignObject")
        .attr("x", -105)
        .attr("y", 25)
        .attr("width", 210)
        .attr("height", 38)
        .append("xhtml:select")
        .on("mousedown", event => event.stopPropagation())
        .on("click", event => event.stopPropagation())
        .on("change", function (event, node) {
            recipeChoices.set(
                node.data.material,
                Number(event.target.value)
            );

            render();
        })
        .each(function (node) {
            const select = d3.select(this);
            const choices = recipesProducing(node.data.material);
            const selectedIndex =
                recipeChoices.get(node.data.material) ?? 0;

            select
                .selectAll("option")
                .data(choices)
                .join("option")
                .attr("value", (_, index) => index)
                .property(
                    "selected",
                    (_, index) => index === selectedIndex
                )
                .text(recipe =>
                    `${recipe.name} — ${recipe.duration} min`
                );
        });
}

function getRecipeChoicesCount(material) {
    return recipesProducing(material).length;
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


function render() {
    const target = document.getElementById("target-select").value;
    const tree = buildCraftingTree(target);

    renderCraftingTree(tree.root);
    renderSummary(tree);
    updateMaterialAvailability();
}

function initialize() {
    const targetSelect = document.getElementById("target-select");
    const searchInput = document.getElementById("tree-search");

    for (const material of materials) {
        const option = document.createElement("option");
        option.value = material;
        option.textContent = material;
        targetSelect.appendChild(option);
    }

    targetSelect.value = "Extractor Kit";

    targetSelect.addEventListener("change", render);

    searchInput.addEventListener("input", event => {
        treeSearch.value = event.target.value;
        render();
    });

    let resizeTimer;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
            render();
        }, 100);
    });


    createExtractorSettings();
    render();
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