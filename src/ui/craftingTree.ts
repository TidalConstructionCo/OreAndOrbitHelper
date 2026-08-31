import d3, { HierarchyPointNode, Selection } from 'd3';
import { Recipe } from '../api-access';
import { RawMaterialNode, RecipeNode, TreeNode } from '../domain/craftingTree/craftingTree';
import { formatAmountNew } from './formatting';

type NodeGroup = d3.Selection<SVGGElement, unknown, null, undefined>;

function createTree(
  treeElement: HTMLElement,
  rootNode: TreeNode,
  searchText: string,
  recipes: Recipe,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
) {
  treeElement.replaceChildren();

  const treeWidth = Math.max(treeElement.clientWidth, 320);
  const treeHeight = Math.max(treeElement.clientHeight, 320);

  const root = d3.hierarchy<TreeNode>(rootNode);

  const treeLayout = d3
    .tree<TreeNode>()
    .nodeSize([280, 130])
    .separation((a, b) => (a.parent === b.parent ? 1.4 : 2));

  treeLayout(root);

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
    .attr('viewBox', `0 0 ${contentWidth} ${contentHeight}`);

  const zoomLayer = svg.append('g').attr('transform', `translate(${170 - (minX ?? 0)}, 80)`);

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    // Allows zooming much farther in and out.
    .scaleExtent([0.15, 8])
    .on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform);
    });

  svg.call(zoom);

  const linkGenerator = d3
    .linkVertical<d3.HierarchyLink<TreeNode>, d3.HierarchyNode<TreeNode>>()
    .x((node) => node.x ?? 0)
    .y((node) => node.y ?? 0);

  zoomLayer
    .append('g')
    .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeNode>>('path')
    .data(links)
    .join('path')
    .attr('class', 'link')
    .attr('d', linkGenerator);

    createNode(zoomLayer, , onRecipeChoiceChanged);
}

// TODO: select correct CSS classes etc
function createNode(
  nodeGroup: NodeGroup,
  node: HierarchyPointNode<TreeNode>,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
) {
  const kind = node.data.kind;
  switch (kind) {
    case 'rawMaterial': {
      createRawMaterialNode(nodeGroup, node.data);
      break;
    }
    case 'recipe': {
      createRecipeNode(nodeGroup, node.data, onRecipeChoiceChanged);
      break;
    }
    default: {
      const exhaustiveCheck: never = kind;
      console.log(exhaustiveCheck);
    }
  }
}

function createRawMaterialNode(nodeGroup: NodeGroup, node: RawMaterialNode) {
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

  nodeGroup
    .append('div')
    .attr('class', 'node-line material')
    .attr('text-anchor', 'middle')
    .text(`${node.targetAmount}x ${node.material.name}`);
}

function createRecipeNode(
  nodeGroup: NodeGroup,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
) {
  const nodeWidth = 240;
  const nodeHeight = 132;

  nodeGroup
    .append('rect')
    .attr('x', -nodeWidth / 2)
    .attr('y', -nodeHeight / 2)
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('rx', 10)
    .attr('ry', 10);

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
    .text(() => {
      return `${formatAmountNew(node.totalCycles)} cycles (${formatAmountNew(node.totalDuration)} min)`;
    });

  content.append('div').attr('class', 'node-line details').text(`${node.utilization}% utilization`);
}

function appendRecipeSelection(
  content: Selection<HTMLDivElement, unknown, null, undefined>,
  node: RecipeNode,
  onRecipeChoiceChanged: (path: string, recipe: Recipe) => void,
) {
  const choiceLine = content.append('div').attr('class', 'node-line');
  choiceLine
    .append('select')
    .attr('class', 'recipe-select')
    .on('mousedown', (event) => event.stopPropagation())
    .on('pointerdown', (event) => event.stopPropagation())
    .on('click', (event) => event.stopPropagation())
    .on('change', function () {
      const selectedIndex = Number(this.value);
      const selectedRecipe = node.recipeChoices[selectedIndex];
      if (selectedRecipe) {
        onRecipeChoiceChanged(node.path.join('>'), selectedRecipe);
      }
    })
    .selectAll('option')
    .data(node.recipeChoices)
    .join('option')
    .attr('value', (_, index) => String(index))
    .property('selected', (recipe) => recipe.id === node.recipe.id)
    .text(formatRecipe);
}

function appendRecipeDisplay(
  content: Selection<HTMLDivElement, unknown, null, undefined>,
  node: RecipeNode,
) {
  const choiceLine = content.append('div').attr('class', 'node-line node-line-empty');
  choiceLine.append('div').text(formatRecipe(node.recipe));
}

function formatRecipe(recipe: Recipe): string {
  // TODO: use material name instead of material
  return `${recipe.inputs.map((input) => input.material).join(' + ')} → ${recipe.output.material + (recipe.byproduct ? ` ${recipe.byproduct.material}` : '')}`;
}
