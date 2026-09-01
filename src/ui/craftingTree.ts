import * as d3 from 'd3';
import type { HierarchyPointLink, HierarchyPointNode, Selection } from 'd3';
import type { Recipe } from '../api-access';
import type { RawMaterialNode, RecipeNode, TreeNode } from '../domain/craftingTree/craftingTree';
import { formatAmountNew, formatPercentNew } from './formatting';

type NodeGroup = Selection<SVGGElement, unknown, null, undefined>;
type ContentSelection = Selection<HTMLDivElement, unknown, null, undefined>;

// TODO: try to replace tree with this one
export function renderCraftingTree(
  treeElement: HTMLElement,
  rootNode: TreeNode,
  searchText: string,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
): void {
  treeElement.replaceChildren();

  const treeWidth = Math.max(treeElement.clientWidth, 320);
  const treeHeight = Math.max(treeElement.clientHeight, 320);

  const treeLayout = d3
    .tree<TreeNode>()
    .nodeSize([300, 175])
    .separation((a, b) => (a.parent === b.parent ? 1.4 : 2));

  const root = treeLayout(d3.hierarchy<TreeNode>(rootNode));

  const nodes = root.descendants();
  const links = root.links();

  const minX = d3.min(nodes, (node) => node.x);
  const maxX = d3.max(nodes, (node) => node.x);
  const maxY = d3.max(nodes, (node) => node.y);

  const contentWidth = Math.max(treeWidth, (maxX ?? 0) - (minX ?? 0) + 340);

  const contentHeight = Math.max(treeHeight, (maxY ?? 0) + 260);

  const svg = d3
    .select(treeElement)
    .append<SVGSVGElement>('svg')
    .attr('width', contentWidth)
    .attr('height', contentHeight)
    .attr('viewBox', `0 0 ${contentWidth} ${contentHeight}`)
    .style('max-width', '100%')
    .style('height', 'auto');

  const zoomLayer = svg.append<SVGGElement>('g');

  const linkLayer = zoomLayer.append<SVGGElement>('g').attr('class', 'links');
  const nodeLayer = zoomLayer.append<SVGGElement>('g').attr('class', 'nodes');

  const linkGenerator = d3
    .linkVertical<HierarchyPointLink<TreeNode>, HierarchyPointNode<TreeNode>>()
    .x((node) => node.x)
    .y((node) => node.y);

  linkLayer
    .selectAll<SVGPathElement, HierarchyPointLink<TreeNode>>('path')
    .data(links)
    .join('path')
    .attr('class', 'link')
    .attr('d', linkGenerator);

  nodeLayer
    .selectAll<SVGGElement, HierarchyPointNode<TreeNode>>('g')
    .data(nodes)
    .join('g')
    .attr('class', (node) => {
      if (!searchText.trim()) {
        return 'tree-node';
      }
      return `tree-node ${nodeMatchesSearch(node.data, searchText) ? 'search-match' : 'search-dim'}`;
    })
    // TODO: decide whether it should be left->right or top->down:
    .attr('transform', (node) => `translate(${node.x}, ${node.y})`)
    .each(function (node) {
      createNode(d3.select<SVGGElement, unknown>(this), node, onRecipeChoiceChanged);
    });

  const initialTransform = d3.zoomIdentity.translate(170 - (minX ?? 0), 80);

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.15, 8])
    .on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform);
    });

  svg.call(zoom).call(zoom.transform, initialTransform);
}

function createNode(
  nodeGroup: NodeGroup,
  node: HierarchyPointNode<TreeNode>,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
): void {
  switch (node.data.kind) {
    case 'rawMaterial':
      createRawMaterialNode(nodeGroup, node.data);
      break;

    case 'recipe':
      createRecipeNode(nodeGroup, node.data, onRecipeChoiceChanged);
      break;

    default: {
      const exhaustiveCheck: never = node.data;
      throw new Error(`Unsupported tree node: ${String(exhaustiveCheck)}`);
    }
  }
}

function createRawMaterialNode(nodeGroup: NodeGroup, node: RawMaterialNode): void {
  const nodeWidth = 180;
  const nodeHeight = 64;

  nodeGroup
    .append('rect')
    .attr('x', -nodeWidth / 2)
    .attr('y', -nodeHeight / 2)
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('class', 'raw-material-node');

  const content = nodeGroup
    .append('foreignObject')
    .attr('x', -nodeWidth / 2 + 8)
    .attr('y', -nodeHeight / 2 + 8)
    .attr('width', nodeWidth - 16)
    .attr('height', nodeHeight - 16)
    .append<HTMLDivElement>('xhtml:div')
    .attr('class', 'node-content');

  content
    .append('div')
    .attr('class', 'node-line material')
    .text(`${node.targetAmount}x ${node.targetMaterial.name}`);

  content.append('div').attr('class', 'node-line details').text('Raw material');
}

function createRecipeNode(
  nodeGroup: NodeGroup,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
): void {
  const nodeWidth = 270;
  const nodeHeight = 154;

  nodeGroup
    .append('rect')
    .attr('x', -nodeWidth / 2)
    .attr('y', -nodeHeight / 2)
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('class', 'recipe-node');

  const content = nodeGroup
    .append('foreignObject')
    .attr('x', -nodeWidth / 2 + 10)
    .attr('y', -nodeHeight / 2 + 8)
    .attr('width', nodeWidth - 20)
    .attr('height', nodeHeight - 16)
    .append<HTMLDivElement>('xhtml:div')
    .attr('class', 'node-content');

  content
    .append('div')
    .attr('class', 'node-line material')
    .text(`${node.targetAmount}x ${node.targetMaterial.name}`);

  if (node.recipeChoices.length > 1) {
    appendRecipeSelection(content, node, onRecipeChoiceChanged);
  } else {
    appendRecipeDisplay(content, node);
  }

  content
    .append('div')
    .attr('class', 'node-line details')
    .text(
      `${formatAmountNew(node.totalCycles)} cycles ` +
        `(${formatAmountNew(node.totalDuration)} min)`,
    );

  content
    .append('div')
    .attr('class', 'node-line details')
    .text(`${formatPercentNew(node.utilization)} utilization`);
}

function appendRecipeSelection(
  content: ContentSelection,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
): void {
  const choiceLine = content.append('div').attr('class', 'node-line');

  choiceLine
    .append('select')
    .attr('class', 'recipe-select')
    .on('mousedown', (event) => event.stopPropagation())
    .on('pointerdown', (event) => event.stopPropagation())
    .on('click', (event) => event.stopPropagation())
    .on('change', function (event) {
      event.stopPropagation();

      const selectedIndex = Number(this.value);
      const selectedRecipe = node.recipeChoices[selectedIndex];

      if (selectedRecipe) {
        onRecipeChoiceChanged(node.path, selectedRecipe);
      }
    })
    .selectAll<HTMLOptionElement, Recipe>('option')
    .data(node.recipeChoices)
    .join('option')
    .attr('value', (_, index) => String(index))
    .property('selected', (recipe) => recipe.id === node.recipe.id)
    .text(formatRecipe);
}

function appendRecipeDisplay(content: ContentSelection, node: RecipeNode): void {
  const choiceLine = content.append('div').attr('class', 'node-line recipe-choice-line');

  choiceLine.append('div').attr('class', 'recipe-line').text(formatRecipe(node.recipe));
}

// TODO: use actual formatting with icons etc
function formatRecipe(recipe: Recipe): string {
  const inputs = recipe.inputs.map((input) => `${input.qty}x ${input.material}`).join(' + ');

  const output =
    `${recipe.output.qty}x ${recipe.output.material}` +
    (recipe.byproduct ? ` ${recipe.byproduct.material}x ${recipe.byproduct.material}` : '');

  return `${inputs} → ${output}`;
}

function nodeMatchesSearch(node: TreeNode, searchText: string): boolean {
  const normalizedSearchText = searchText.trim().toLowerCase();

  // An empty search should not dim any nodes.
  if (!normalizedSearchText) {
    return true;
  }

  let materialName: string;

  switch (node.kind) {
    case 'rawMaterial':
      materialName = node.targetMaterial.name;
      break;

    case 'recipe':
      materialName = node.targetMaterial.name;
      break;

    default: {
      const exhaustiveCheck: never = node;
      throw new Error(`Unsupported tree node: ${String(exhaustiveCheck)}`);
    }
  }

  return materialName.toLowerCase().includes(normalizedSearchText);
}
