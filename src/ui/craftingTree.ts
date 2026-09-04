import * as d3 from 'd3';
import type { HierarchyPointLink, HierarchyPointNode, Selection } from 'd3';
import type { Material, Recipe } from '../api-access';
import type {
  RawMaterialNode,
  RecipeNode,
  SourcedNode,
  TreeNode,
  TreePath,
} from '../domain/craftingTree/craftingTree';
import { formatAmountNew, formatPercentNew } from './formatting';

type NodeGroup = Selection<SVGGElement, unknown, null, undefined>;
type ContentSelection = Selection<HTMLDivElement, unknown, null, undefined>;

// TODO: try to replace tree with this one
export function renderCraftingTree(
  treeElement: HTMLElement,
  rootNode: TreeNode,
  searchText: string,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
  onForceRecipeOverrideChanged: (path: TreePath, isRaw: boolean) => void,
): void {
  const existingSvg = treeElement.querySelector<SVGSVGElement>(':scope > svg');

  const previousTransform = existingSvg ? d3.zoomTransform(existingSvg) : undefined;
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
    .attr('viewBox', `0 0 ${String(contentWidth)} ${String(contentHeight)}`)
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
      if (searchText.trim().length === 0) {
        return 'tree-node';
      }
      return `tree-node ${nodeMatchesSearch(node.data, searchText) ? 'search-match' : 'search-dim'}`;
    })
    // TODO: decide whether it should be left->right or top->down:
    .attr('transform', (node) => `translate(${String(node.x)}, ${String(node.y)})`)
    .each(function (node) {
      createNode(
        d3.select<SVGGElement, unknown>(this),
        node,
        onRecipeChoiceChanged,
        onForceRecipeOverrideChanged,
      );
    });

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.15, 8])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomLayer.attr('transform', event.transform.toString());
    });

  svg.call(zoom);

  if (previousTransform !== undefined) {
    svg.call((selection): void => {
      zoom.transform(selection, previousTransform);
    });
  } else {
    const initialTransform = d3.zoomIdentity.translate(170 - (minX ?? 0), 80);

    svg.call((selection): void => {
      zoom.transform(selection, initialTransform);
    });
  }
}

function createNode(
  nodeGroup: NodeGroup,
  node: HierarchyPointNode<TreeNode>,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
  onForceRecipeOverrideChanged: (path: TreePath, isRaw: boolean) => void,
): void {
  switch (node.data.kind) {
    case 'rawMaterial':
      createRawMaterialNode(nodeGroup, node.data, onForceRecipeOverrideChanged);
      break;

    case 'recipe':
      createRecipeNode(nodeGroup, node.data, onRecipeChoiceChanged, onForceRecipeOverrideChanged);
      break;

    case 'sourced':
      createSourcedMaterialNode(nodeGroup, node.data);
      break;

    default: {
      node.data satisfies never;
    }
  }
}

function createRawMaterialNode(
  nodeGroup: NodeGroup,
  node: RawMaterialNode,
  onForceRecipeOverrideChanged: (path: TreePath, isRaw: boolean) => void,
): void {
  const nodeWidth = 180;
  const nodeHeight = 96;

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

  addMaterialTitle(content, node.targetMaterial, node.targetAmount);
  content.append('div').attr('class', 'node-line details').text('Raw material');

  if (!node.hasCraftingRecipe) {
    return;
  }
  const actionRow = content.append('div').attr('class', 'node-actions');
  actionRow
    .append('button')
    .attr('type', 'button')
    .attr('class', 'force-recipe-button')
    .text('Craft')
    .on('click', (event: MouseEvent) => {
      event.stopPropagation();
      onForceRecipeOverrideChanged(node.path, true);
    });
}

function createSourcedMaterialNode(nodeGroup: NodeGroup, node: SourcedNode): void {
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
    .attr('class', 'sourced-material-node');

  const content = nodeGroup
    .append('foreignObject')
    .attr('x', -nodeWidth / 2 + 8)
    .attr('y', -nodeHeight / 2 + 8)
    .attr('width', nodeWidth - 16)
    .attr('height', nodeHeight - 16)
    .append<HTMLDivElement>('xhtml:div')
    .attr('class', 'node-content');

  addMaterialTitle(content, node.targetMaterial, node.targetAmount);
  content.append('div').attr('class', 'node-line details').text('Sourced');
}

function addMaterialTitle(
  container: d3.Selection<HTMLDivElement, unknown, null, undefined>,
  material: Material,
  targetAmound: number,
): void {
  const materialLine = container.append('div').attr('class', 'node-line material');
  materialLine
    .append('span')
    .attr('class', 'material-amount')
    .text(`${String(targetAmound)}x `);
  materialLine
    .append('img')
    .attr('class', 'material-icon')
    .attr('src', material.icon)
    .attr('width', 16)
    .attr('height', 16);
  materialLine.append('span').text(material.name);
}

function createRecipeNode(
  nodeGroup: NodeGroup,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
  onForceRecipeOverrideChanged: (path: TreePath, isRaw: boolean) => void,
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

  addMaterialTitle(content, node.targetMaterial, node.targetAmount);

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

  if (!node.hasExtractionRecipe) {
    return;
  }
  const actionRow = content.append('div').attr('class', 'node-actions');
  actionRow
    .append('button')
    .attr('type', 'button')
    .attr('class', 'force-recipe-button')
    .text('Extract')
    .on('click', (event: MouseEvent) => {
      event.stopPropagation();
      onForceRecipeOverrideChanged(node.path, false);
    });
}

const stopEventPropagation = (event: Event): void => {
  event.stopPropagation();
};

function appendRecipeSelection(
  content: ContentSelection,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
): void {
  const choiceLine = content.append('div').attr('class', 'node-line');

  choiceLine
    .append('select')
    .attr('class', 'recipe-select')
    .on('mousedown', stopEventPropagation)
    .on('pointerdown', stopEventPropagation)
    .on('click', stopEventPropagation)
    .on('change', function (this: HTMLSelectElement, event: Event) {
      event.stopPropagation();

      const selectedIndex = Number(this.value);
      const selectedRecipe = node.recipeChoices[selectedIndex];

      if (selectedRecipe !== undefined) {
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
  const inputs = recipe.inputs
    .map((input) => `${String(input.qty)}x ${input.material}`)
    .join(' + ');

  const output =
    `${String(recipe.output.qty)}x ${recipe.output.material}` +
    (recipe.byproduct !== null
      ? ` ${recipe.byproduct.material}x ${recipe.byproduct.material}`
      : '');

  return `${inputs} → ${output}`;
}

function nodeMatchesSearch(node: TreeNode, searchText: string): boolean {
  const normalizedSearchText = searchText.trim().toLowerCase();

  // An empty search should not dim any nodes.
  if (normalizedSearchText.length === 0) {
    return true;
  }

  let materialName = '';

  const kind = node.kind;
  switch (kind) {
    case 'rawMaterial':
    case 'recipe':
    case 'sourced':
      materialName = node.targetMaterial.name;
      break;
    default: {
      kind satisfies never;
    }
  }

  return materialName.toLowerCase().includes(normalizedSearchText);
}
