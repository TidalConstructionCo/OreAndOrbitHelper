import { CraftingTree, TreeNode } from '../domain/crafting-tree';
import { CraftingTreeNew, TreeNodeNew } from '../domain/craftingTreeNew';
import { formatAmount, formatPercent, formatRecipe } from './formatting';

export function renderSummary(tree: CraftingTree, summaryElement: HTMLElement) {
  summaryElement.replaceChildren();

  const rawPanel = document.createElement('div');
  rawPanel.className = 'panel';

  const rawTitle = document.createElement('h2');
  rawTitle.textContent = 'Raw materials per crafting cycle';
  rawPanel.appendChild(rawTitle);

  const rawList = document.createElement('ul');

  for (const [material, amount] of Object.entries(tree.rawMaterials)) {
    const item = document.createElement('li');
    item.textContent = `${formatAmount(amount)}x ${material}`;
    rawList.appendChild(item);
  }

  if (rawList.children.length === 0) {
    appendEmptyMessage(rawList);
  }

  rawPanel.appendChild(rawList);
  summaryElement.appendChild(rawPanel);

  // New recipe utilization panel
  const utilizationPanel = document.createElement('div');
  utilizationPanel.className = 'panel';

  const utilizationTitle = document.createElement('h2');
  utilizationTitle.textContent = 'Summed recipe utilization';
  utilizationPanel.appendChild(utilizationTitle);

  const utilizationList = document.createElement('ul');
  const recipeTotals = summedRecipeUtilization(tree.root);

  for (const [recipe, utilization] of recipeTotals) {
    const item = document.createElement('li');

    item.textContent = `${formatPercent(utilization)}: ${formatRecipe(recipe)}`;

    utilizationList.appendChild(item);
  }

  if (utilizationList.children.length === 0) {
    appendEmptyMessage(utilizationList);
  }

  utilizationPanel.appendChild(utilizationList);
  summaryElement.appendChild(utilizationPanel);

  const extractorPanel = document.createElement('div');
  extractorPanel.className = 'panel';

  const extractorTitle = document.createElement('h2');
  extractorTitle.textContent = `Extractors needed to supply one ${tree.root.material} chain permanently`;
  extractorPanel.appendChild(extractorTitle);

  const extractorList = document.createElement('ul');

  for (const requirement of tree.extractorRequirements) {
    const item = document.createElement('li');
    item.textContent =
      `${formatAmount(requirement.extractors)}x ` + `${requirement.material} extractor`;
    extractorList.appendChild(item);
  }

  if (extractorList.children.length === 0) {
    appendEmptyMessage(extractorList);
  }

  extractorPanel.appendChild(extractorList);
  summaryElement.appendChild(extractorPanel);
}

export function renderSummaryNew(tree: CraftingTreeNew, summaryElement: HTMLElement) {
  summaryElement.replaceChildren();

  const rawPanel = document.createElement('div');
  rawPanel.className = 'panel';

  const rawTitle = document.createElement('h2');
  rawTitle.textContent = 'Raw materials per crafting cycle';
  rawPanel.appendChild(rawTitle);

  const rawList = document.createElement('ul');

  for (const [material, amount] of Object.entries(tree.rawMaterials)) {
    const item = document.createElement('li');
    item.textContent = `${formatAmount(amount)}x ${material}`;
    rawList.appendChild(item);
  }

  if (rawList.children.length === 0) {
    appendEmptyMessage(rawList);
  }

  rawPanel.appendChild(rawList);
  summaryElement.appendChild(rawPanel);

  // New recipe utilization panel
  const utilizationPanel = document.createElement('div');
  utilizationPanel.className = 'panel';

  const utilizationTitle = document.createElement('h2');
  utilizationTitle.textContent = 'Summed recipe utilization';
  utilizationPanel.appendChild(utilizationTitle);

  const utilizationList = document.createElement('ul');
  const recipeTotals = summedRecipeUtilizationNew(tree.root);

  for (const [recipe, utilization] of recipeTotals) {
    const item = document.createElement('li');

    item.textContent = `${formatPercent(utilization)}: ${formatRecipe(recipe)}`;

    utilizationList.appendChild(item);
  }

  if (utilizationList.children.length === 0) {
    appendEmptyMessage(utilizationList);
  }

  utilizationPanel.appendChild(utilizationList);
  summaryElement.appendChild(utilizationPanel);

  const extractorPanel = document.createElement('div');
  extractorPanel.className = 'panel';

  const extractorTitle = document.createElement('h2');
  extractorTitle.textContent = `Extractors needed to supply one ${tree.root.material} chain permanently`;
  extractorPanel.appendChild(extractorTitle);

  const extractorList = document.createElement('ul');

  for (const requirement of tree.extractorRequirements) {
    const item = document.createElement('li');
    item.textContent =
      `${formatAmount(requirement.extractors)}x ` + `${requirement.material} extractor`;
    extractorList.appendChild(item);
  }

  if (extractorList.children.length === 0) {
    appendEmptyMessage(extractorList);
  }

  extractorPanel.appendChild(extractorList);
  summaryElement.appendChild(extractorPanel);
}

function summedRecipeUtilization(rootNode: TreeNode) {
  const totals = new Map();

  function visit(node: TreeNode) {
    if (!node.isRaw && !node.cycleDetected && node.recipe && node.utilization != null) {
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

function summedRecipeUtilizationNew(rootNode: TreeNodeNew) {
  const totals = new Map();

  function visit(node: TreeNodeNew) {
    if (!node.isRaw && !node.cycleDetected && node.recipe && node.utilization != null) {
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

function appendEmptyMessage(list: HTMLUListElement) {
  const item = document.createElement('li');
  item.className = 'muted';
  item.textContent = 'None';
  list.appendChild(item);
}
