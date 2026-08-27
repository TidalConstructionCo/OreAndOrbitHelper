import * as d3 from "d3";
import type { TreeNode } from "../domain/crafting-tree";
import type { Recipe } from "../crafting-data";
import { formatAmount, formatPercent } from "./formatting";





type RenderCraftingTreeOptions = {
    treeElement: HTMLElement;
    rootNode: TreeNode;
    recipeChoices: ReadonlyMap<string, number>;
    searchText: string;
    recipes: Recipe[];
    onRecipeChoiceChanged: (
        material: string,
        recipeIndex: number
    ) => void;
};

export function renderCraftingTree({
    treeElement,
    rootNode,
    recipeChoices,
    searchText,
    recipes,
    onRecipeChoiceChanged
}: RenderCraftingTreeOptions) {
    treeElement.replaceChildren();

    const treeWidth = Math.max(treeElement.clientWidth, 320);
    const treeHeight = Math.max(treeElement.clientHeight, 320);


    const root = d3.hierarchy<TreeNode>(rootNode);

    const treeLayout = d3.tree<TreeNode>()
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
        (maxX ?? 0) - (minX ?? 0) + 340
    );

    const contentHeight = Math.max(
        treeHeight,
        (maxY ?? 0) + 260
    );

    const svg = d3.select(treeElement)
        .append<SVGSVGElement>("svg")
        .attr("width", contentWidth)
        .attr("height", contentHeight)
        .attr("viewBox", `0 0 ${contentWidth} ${contentHeight}`);

    const zoomLayer = svg.append("g")
        .attr(
            "transform",
            `translate(${170 - (minX ?? 0)}, 80)`
        );



    const zoom = d3.zoom<SVGSVGElement, unknown>()
        // Allows zooming much farther in and out.
        .scaleExtent([0.15, 8])
        .on("zoom", event => {
            zoomLayer.attr("transform", event.transform);
        });

    svg.call(zoom);

    const linkGenerator = d3.linkVertical<
        d3.HierarchyLink<TreeNode>,
        d3.HierarchyNode<TreeNode>
    >()
        .x(node => node.x ?? 0)
        .y(node => node.y ?? 0);

    zoomLayer
        .append("g")
        .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeNode>>("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("d", linkGenerator);


    const searchQuery = getTreeSearchQuery(searchText);

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
                if (nodeMatchesSearch(node, searchText)) {
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

            return getRecipeChoicesCount(recipes, node.data.material) > 1
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
                `${formatPercent(node.data.utilization ?? 0)} utilization`;
        });


    nodeSelection
        .filter(node =>
            !node.data.isRaw &&
            !node.data.cycleDetected &&
            getRecipeChoicesCount(recipes, node.data.material) > 1
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
            const select = event.currentTarget as HTMLSelectElement;

            onRecipeChoiceChanged(
                node.data.material,
                Number(select.value)
            );
        })
        .each(function (node) {
            const select = d3.select(this);
            const choices = recipesProducing(recipes, node.data.material);
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
function getTreeSearchQuery(searchText: string): string {
    return searchText.trim().toLowerCase();
}

function nodeMatchesSearch(node: d3.HierarchyNode<TreeNode>, searchQuery: string) {
    return node.data.material.toLowerCase().includes(searchQuery);
}



function getRecipeChoicesCount(recipes: Recipe[], material: string): number {
    return recipesProducing(recipes, material).length;
}

function recipesProducing(recipes: Recipe[], material: string): Recipe[] {
    return recipes.filter(recipe =>
        recipe.outputs.some(output => output.material === material)
    );
}