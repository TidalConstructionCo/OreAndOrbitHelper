import type { Material } from '../api-access';
import type { CraftingTree } from '../domain/craftingTree/craftingTree';
import type { RecipeUtilization } from '../domain/craftingTree/treeAnalysis';
import { formatAmountNew, formatPercentNew, formatRecipeNew } from './formatting';

export function renderSummary(
  tree: CraftingTree,
  rawItemAmounts: Map<Material, number>,
  sourcedItemAmounts: Map<Material, number>,
  utilization: RecipeUtilization,
  summaryElement: HTMLElement,
  extractorRequirements: Map<Material, number>,
): void {
  // TODO: don't replace children anymore, cache and update in place
  summaryElement.replaceChildren();

  const rawPanel = createRawMaterialsDisplay(rawItemAmounts);
  summaryElement.appendChild(rawPanel);

  const sourcedPanel = createSourcedMaterialDisplay(sourcedItemAmounts);
  summaryElement.appendChild(sourcedPanel);

  const utilizationPanel = createUtilizationDisplay(utilization);
  summaryElement.appendChild(utilizationPanel);

  const extractorPanel = createExtractorPanel(extractorRequirements, tree.root.targetMaterial.name);
  summaryElement.appendChild(extractorPanel);
}

function appendEmptyMessage(list: HTMLUListElement): void {
  const item = document.createElement('li');
  item.className = 'muted';
  item.textContent = 'None';
  list.appendChild(item);
}

function createUtilizationDisplay(utilization: RecipeUtilization): HTMLDivElement {
  const utilizationPanel = document.createElement('div');
  utilizationPanel.className = 'panel';

  const utilizationTitle = document.createElement('h2');
  utilizationTitle.textContent = 'Summed recipe utilization';
  utilizationPanel.appendChild(utilizationTitle);

  const utilizationList = document.createElement('ul');
  const recipeTotals = utilization;

  for (const [recipe, utilization] of recipeTotals) {
    const item = document.createElement('li');

    item.textContent = `${formatPercentNew(utilization)}: ${formatRecipeNew(recipe)}`;

    utilizationList.appendChild(item);
  }

  if (utilizationList.children.length === 0) {
    appendEmptyMessage(utilizationList);
  }

  utilizationPanel.appendChild(utilizationList);
  return utilizationPanel;
}

function createRawMaterialsDisplay(rawItemAmounts: Map<Material, number>): HTMLDivElement {
  const rawPanel = document.createElement('div');
  rawPanel.className = 'panel';

  const rawTitle = document.createElement('h2');
  rawTitle.textContent = 'Raw materials per crafting cycle';
  rawPanel.appendChild(rawTitle);

  const rawList = document.createElement('ul');

  for (const [material, amount] of rawItemAmounts) {
    const item = document.createElement('li');
    const itemContainer = createMaterialDisplay(material, amount);
    item.appendChild(itemContainer);
    rawList.appendChild(item);
  }

  if (rawList.children.length === 0) {
    appendEmptyMessage(rawList);
  }

  rawPanel.appendChild(rawList);
  return rawPanel;
}

// TODO: pretty much duplicate with raw materials, fix
function createSourcedMaterialDisplay(sourcedItemAmounts: Map<Material, number>): HTMLDivElement {
  const sourcedPanel = document.createElement('div');
  sourcedPanel.className = 'panel';

  const sourcedTitle = document.createElement('h2');
  sourcedTitle.textContent = 'Sourced materials per crafting cycle';
  sourcedPanel.appendChild(sourcedTitle);

  const sourcedList = document.createElement('ul');

  for (const [material, amount] of sourcedItemAmounts) {
    const item = document.createElement('li');
    const itemContainer = createMaterialDisplay(material, amount);
    item.appendChild(itemContainer);
    sourcedList.appendChild(item);
  }

  if (sourcedList.children.length === 0) {
    appendEmptyMessage(sourcedList);
  }

  sourcedPanel.appendChild(sourcedList);
  return sourcedPanel;
}

function createMaterialDisplay(material: Material, amount: number): HTMLDivElement {
  const itemContainer = document.createElement('div');
  const itemAmount = document.createElement('span');
  itemAmount.textContent = `${formatAmountNew(amount)}x `;
  itemContainer.appendChild(itemAmount);

  const itemIcon = document.createElement('img');
  itemIcon.src = material.icon;
  itemIcon.width = 24;
  itemIcon.height = 24;
  itemContainer.appendChild(itemIcon);

  const itemName = document.createElement('span');
  itemName.textContent = material.name;
  itemContainer.appendChild(itemName);
  return itemContainer;
}

function createExtractorPanel(
  extractorRequirements: Map<Material, number>,
  rootMaterialName: string,
): HTMLDivElement {
  const extractorPanel = document.createElement('div');
  extractorPanel.className = 'panel';

  const extractorTitle = document.createElement('h2');
  extractorTitle.textContent = `Extractors needed to supply one ${rootMaterialName} chain permanently`;
  extractorPanel.appendChild(extractorTitle);

  const extractorList = document.createElement('ul');

  for (const [material, extractorCount] of extractorRequirements) {
    const item = document.createElement('li');
    const itemContainer = createMaterialDisplay(material, extractorCount);
    item.appendChild(itemContainer);
    extractorList.appendChild(item);
  }

  if (extractorList.children.length === 0) {
    appendEmptyMessage(extractorList);
  }

  extractorPanel.appendChild(extractorList);
  return extractorPanel;
}
