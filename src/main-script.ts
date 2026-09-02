// TODO
/**
 * - FIRST: recipe selection in tree
 * - change based rendering
 * - overclocking and underclocking
 * - searchable target selector
 * - clean up tree logic => lots of info that should probably not live on the nodes
 * - clean up where are ids, strings, objects used and what should it actually be
 * - fix error in craftingTreeNew
 * - add unit tests for state transitions
 * - maybe replace tree with filetree-like view
 * - clean up main script page
 * - handle all the optionals from query selectors
 * - progress indicator for fetching API data
 * - sort numeric values
 */
import { API_KEY_STORAGE_KEY, getApiKey, initializeApiPageNew } from './api-key.js';
import { renderSummary } from './ui/summary';
import type { Recipe } from './api-access';
import {
  ExtractionResponseSchema,
  getExtraction,
  getMaterials,
  getRecipes,
  MaterialsResponseSchema,
  RecipesResponseSchema,
} from './api-access';
import { CACHE_KEYS, loadCache, saveToCache } from './cache';
import type { AppState, GameData, MaterialId, TabId } from './app/state.js';
import { createInitialState } from './app/state.js';
import { renderExtractorSettingsNew } from './ui/extractorSettings.js';
import { buildTree } from './domain/craftingTree/craftingTree.js';
import { renderCraftingTree } from './ui/craftingTree.js';
import {
  getExtractorRequirements,
  getSummedRawItems,
  getSummedSourcedItems,
  getSummedUtilization,
} from './domain/craftingTree/treeAnalysis.js';

let GLOBAL_STATE = createInitialState();
const buttons = document.querySelectorAll<HTMLElement>('.tool-button');
function update(newState: AppState): void {
  GLOBAL_STATE = newState;
  render();
}

// TODO: probably move somewhere else (domain)?
function loadCachedGameData(state: AppState): AppState {
  const cachedMaterials = loadCache(CACHE_KEYS.materials, MaterialsResponseSchema);
  const cachedRecipes = loadCache(CACHE_KEYS.recipes, RecipesResponseSchema);
  const cachedExtraction = loadCache(CACHE_KEYS.locations, ExtractionResponseSchema);

  return {
    ...state,
    gameData: {
      materialData:
        cachedMaterials !== undefined ? cachedMaterials.data : state.gameData.materialData,
      recipeData: cachedRecipes !== undefined ? cachedRecipes.data : state.gameData.recipeData,
      extractionData:
        cachedExtraction !== undefined ? cachedExtraction.data : state.gameData.extractionData,
    },
  };
}

function loadApiKey(state: AppState): AppState {
  const key = getApiKey();
  return {
    ...state,
    settings: {
      ...state.settings,
      storedApiKey: key !== undefined ? key : state.settings.storedApiKey,
    },
  };
}

async function updateGameData(state: AppState): Promise<AppState> {
  // TODO: add "failed to fetch api data" to app state
  // TODO: fix display name of materials
  const result = { ...state };
  const materialApiResult = await getMaterials();
  // TODO: streamline, almost duplicated to the cache load case
  if (materialApiResult !== undefined) {
    result.gameData.materialData = materialApiResult;
    saveToCache(CACHE_KEYS.materials, materialApiResult);
  }

  const recipeApiResult = await getRecipes();
  if (recipeApiResult !== undefined) {
    result.gameData.recipeData = recipeApiResult;
    saveToCache(CACHE_KEYS.recipes, recipeApiResult);
  }

  const extractionApiResult = await getExtraction();
  if (extractionApiResult !== undefined) {
    result.gameData.extractionData = extractionApiResult;
    saveToCache(CACHE_KEYS.locations, extractionApiResult);
  }

  return result;
}

function initializeReloadDataButton(): void {
  const reloadGameDataButton = document.querySelector<HTMLButtonElement>('#reload-game-data');
  if (reloadGameDataButton !== null) {
    reloadGameDataButton.addEventListener('click', (): void => {
      void (async (): Promise<void> => {
        reloadGameDataButton.disabled = true;

        try {
          const newState = await updateGameData(GLOBAL_STATE);
          update(newState);
        } finally {
          reloadGameDataButton.disabled = false;
        }
      })();
    });
  }
}

function updateSearchText(state: AppState, searchText: string): AppState {
  return { ...state, craftingTree: { ...state.craftingTree, searchText } };
}

function initializeSearchButton(): void {
  const searchInput = document.querySelector<HTMLInputElement>('#tree-search');
  if (searchInput !== null) {
    searchInput.addEventListener('input', () => {
      const newState = updateSearchText(GLOBAL_STATE, searchInput.value);
      update(newState);
    });
  }
}

function initializeResizeHandler(): void {
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      update(GLOBAL_STATE);
    }, 100);
  });
}

function updateSelectedTarget(state: AppState, selectedTarget: string): AppState {
  const matchingMaterial = state.gameData.materialData.data.find((m) => m.id === selectedTarget);
  if (matchingMaterial !== undefined) {
    return { ...state, craftingTree: { ...state.craftingTree, targetMaterial: matchingMaterial } };
  } else {
    return state;
  }
}

function initializeTargetSelect(): void {
  const targetSelect = document.querySelector<HTMLSelectElement>('#target-select');
  targetSelect?.addEventListener('change', () => {
    const newState = updateSelectedTarget(GLOBAL_STATE, targetSelect.value);
    update(newState);
  });
}

function updateSelectedTab(state: AppState, selectedTab: TabId | undefined): AppState {
  if (selectedTab === undefined) {
    return state;
  }

  return { ...state, selectedTab };
}

export function initializeToolTabsNew(): void {
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedTool = button.dataset['tool'];

      const newState = updateSelectedTab(
        GLOBAL_STATE,
        // TODO: this is a bit ugly
        selectedTool !== undefined ? (selectedTool as TabId) : undefined,
      );
      update(newState);
    });
  });
}

function updateApiKey(state: AppState, newKey: string | undefined): AppState {
  return { ...state, settings: { ...state.settings, storedApiKey: newKey } };
}

function initialize(): void {
  // TODO: maybe group the cache loading?
  let newState = { ...GLOBAL_STATE };
  newState = loadApiKey(newState);
  newState = loadCachedGameData(newState);
  for (const material of newState.gameData.extractionData.data.map((e) => e.material)) {
    newState = updateAvailability(newState, material, 5);
  }
  if (
    newState.craftingTree.targetMaterial === undefined &&
    newState.gameData.materialData.data[0] !== undefined
  ) {
    newState = updateSelectedTarget(newState, newState.gameData.materialData.data[0].id);
  }

  initializeReloadDataButton();
  initializeSearchButton();
  initializeTargetSelect();
  initializeExtractorSettings();
  initializeSourcedMaterialSelect();
  initializeAddSourcedMaterialButton();
  initializeSourcedMaterialButtons();
  initializeToolTabsNew();
  initializeApiPageNew(
    (event: SubmitEvent): void => {
      // TODO: maybe trim down what parts of the handler need to live here and what can be added at the implementation site
      event.preventDefault();
      // TODO: get query selector out of here? also handle null differently?
      const input = document.querySelector<HTMLInputElement>('#apiKeyInput');

      if (input === null) {
        return;
      }
      const apiKey = input.value.trim();

      if (apiKey.length === 0) {
        return;
      }

      // TODO: clean up where the storage access should live
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);

      input.value = '';
      const newState = updateApiKey(GLOBAL_STATE, apiKey);
      update(newState);
    },
    (): void => {
      const confirmed: boolean = window.confirm(
        'Are you sure you want to remove the stored API key?',
      );

      if (confirmed) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        const newState = updateApiKey(GLOBAL_STATE, undefined);
        update(newState);
      }
    },
  );
  initializeResizeHandler();

  update(newState);
}

// end new state stuff

function updateAvailability(state: AppState, material: MaterialId, amount: number): AppState {
  return {
    ...state,
    craftingTree: {
      ...state.craftingTree,
      extractionYields: {
        ...state.craftingTree.extractionYields,
        [material]: amount,
      },
    },
  };
}
// TODO: move the document.queryselector to top level once, then only refer to the objects from there on
export function initializeExtractorSettings(): void {
  const extractorSettings = document.querySelector<HTMLElement>('.extractor-settings');

  // TODO: using change as event target for now so I don't rerender while dragging.
  // Later, I should do change based rendering so I can still update the relevant numbers (slider level and extractor count) while dragging
  extractorSettings?.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.type !== 'range') {
      return;
    }

    const child = target.closest<HTMLElement>('.extractor-setting');
    if (child === null) {
      return;
    }

    const newState = updateAvailability(GLOBAL_STATE, target.name, Number(target.value));
    update(newState);
  });
}

function renderToolbar(selectedTab: TabId): void {
  const buttons = document.querySelectorAll<HTMLElement>('.tool-button');
  const panels = document.querySelectorAll<HTMLElement>('.tool-panel');

  const selectedTool = selectedTab;
  buttons.forEach((button) => {
    button.classList.toggle('active', selectedTool === button.dataset['tool']);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === selectedTool);
  });
}

function isGameDataReady(gameData: GameData): boolean {
  // TODO: get a better way to determine
  return (
    gameData.materialData.data.length > 0 &&
    gameData.recipeData.data.length > 0 &&
    gameData.extractionData.data.length > 0
  );
}

function obfuscateApiKey(apiKey: string, visibleCharacters: number): string {
  if (apiKey.length <= visibleCharacters) {
    return '•'.repeat(apiKey.length);
  }

  const hiddenCharacters = '•'.repeat(apiKey.length - visibleCharacters);

  const visibleSuffix = apiKey.slice(-visibleCharacters);

  return `${hiddenCharacters}${visibleSuffix}`;
}

function renderStoredKey(
  storedApiKey: string | undefined,
  storedKeyContainer: HTMLDivElement,
  removeButton: HTMLButtonElement,
  keyValue: HTMLElement,
): void {
  const VISIBLE_CHARACTERS = 4;
  const hasStoredKey: boolean = Boolean(storedApiKey);

  storedKeyContainer.hidden = !hasStoredKey;
  removeButton.hidden = !hasStoredKey;

  if (storedApiKey !== undefined) {
    keyValue.textContent = obfuscateApiKey(storedApiKey, VISIBLE_CHARACTERS);
  } else {
    keyValue.textContent = '';
  }
}

function renderSettingsTab(state: AppState, parent: HTMLElement): void {
  const storedKeyContainer = parent.querySelector<HTMLDivElement>('#storedKey');
  const keyValue = parent.querySelector<HTMLElement>('#keyValue');
  const removeButton = parent.querySelector<HTMLButtonElement>('#removeKeyButton');

  if (storedKeyContainer === null || keyValue === null || removeButton === null) {
    throw new Error('Required DOM elements were not found.');
  }

  renderStoredKey(state.settings.storedApiKey, storedKeyContainer, removeButton, keyValue);
}

function renderMaterialSelect(state: AppState, select: HTMLSelectElement): void {
  const targetMaterial = state.craftingTree.targetMaterial;
  select.replaceChildren();

  const materials = state.gameData.materialData.data;
  for (const material of materials) {
    const option = document.createElement('option');
    // TODO: one of them should be the display name
    option.value = material.id;
    option.textContent = material.id;
    select.appendChild(option);
  }

  // Preserve the selected target when it still exists.
  if (
    targetMaterial !== undefined &&
    materials.some((material) => material.id === targetMaterial.id)
  ) {
    select.value = targetMaterial.id;
  } else {
    select.selectedIndex = 0;
  }
}

function renderCraftingTreeInputs(state: AppState): void {
  const targetSelect = document.querySelector<HTMLSelectElement>('#target-select');
  if (targetSelect !== null) {
    renderMaterialSelect(state, targetSelect);
  }
}

function updateRecipeSelection(state: AppState, path: string, recipe: Recipe): AppState {
  const newChoices = new Map(state.craftingTree.recipeChoices);
  newChoices.set(path, recipe);
  return {
    ...state,
    craftingTree: { ...state.craftingTree, recipeChoices: newChoices },
  };
}

function renderCraftingTreeContent(state: AppState, parent: HTMLElement): void {
  const treeElement = parent.querySelector<HTMLDivElement>('.tree');
  if (treeElement === null) {
    // TODO: shouldnt happen
    return;
  }

  renderCraftingTreeInputs(state);
  if (state.craftingTree.targetMaterial === undefined) {
    return;
  }
  const tree = buildTree(
    state.craftingTree.targetMaterial,
    state.gameData.materialData.data,
    state.gameData.recipeData.data,
    state.craftingTree.recipeChoices,
    state.craftingTree.sourcedMaterials,
  );

  renderCraftingTree(
    treeElement,
    tree.root,
    state.craftingTree.searchText ?? '',
    (path: string, recipe: Recipe) => {
      const newState = updateRecipeSelection(state, path, recipe);
      update(newState);
    },
  );
  const extractorSettingsContainer = parent.querySelector<HTMLElement>('.extractor-settings');
  if (extractorSettingsContainer !== null) {
    renderExtractorSettingsNew(state, extractorSettingsContainer);
  }
  const sourcedMaterialsContainer = parent.querySelector<HTMLDivElement>('.sourced-materials');
  if (sourcedMaterialsContainer !== null) {
    renderSourcedMaterials(state, sourcedMaterialsContainer);
  }
  const summary = document.getElementById('summary');
  if (summary !== null) {
    renderSummary(
      tree,
      getSummedRawItems(tree),
      getSummedSourcedItems(tree),
      getSummedUtilization(tree),
      summary,
      getExtractorRequirements(
        tree,
        state.gameData.extractionData.data,
        state.craftingTree.extractionYields,
      ),
    );
  }
}

function renderCraftingTreeTab(state: AppState, parent: HTMLElement): void {
  const unavailableMessage = parent.querySelector<HTMLElement>('.tool-unavailable');
  const toolContent = parent.querySelector<HTMLElement>('.tool-content');

  if (unavailableMessage === null || toolContent === null) {
    return;
  }

  const ready = isGameDataReady(state.gameData);
  unavailableMessage.hidden = ready;
  toolContent.hidden = !ready;
  if (ready) {
    renderCraftingTreeContent(state, toolContent);
  }
}

function renderSelectedTool(state: AppState): void {
  let selectedPanel: HTMLElement | undefined;

  const selectedTab = state.selectedTab;
  document.querySelectorAll<HTMLElement>('.tool-panel').forEach((panel) => {
    const isSelected = panel.id === selectedTab;

    panel.hidden = !isSelected;

    if (isSelected) {
      selectedPanel = panel;
    }
  });

  if (selectedPanel === undefined) {
    return;
  }

  switch (selectedTab) {
    case 'crafting-tree':
      renderCraftingTreeTab(state, selectedPanel);
      break;

    case 'settings':
      renderSettingsTab(state, selectedPanel);
      break;

    default: {
      const exhaustiveCheck: never = selectedTab;
      console.log(exhaustiveCheck);
    }
  }
}

function render(): void {
  // TODO: pass more concrete stuff than the full object
  renderToolbar(GLOBAL_STATE.selectedTab);
  renderSelectedTool(GLOBAL_STATE);
}

initialize();

// TODO: initialize with event handler
// TODO: also implement "add"-button
function renderSourcedMaterials(state: AppState, parent: HTMLDivElement): void {
  const select = parent.querySelector<HTMLSelectElement>('#sourced-material-select');
  if (select === null) {
    return;
  }
  const targetMaterial = state.craftingTree.selectedSourcedMaterial;
  select.replaceChildren();

  const remainingMaterials = state.gameData.materialData.data.filter(
    (material) =>
      !state.craftingTree.sourcedMaterials.some((sourced) => sourced.id === material.id),
  );
  for (const material of remainingMaterials) {
    const option = document.createElement('option');
    // TODO: one of them should be the display name
    option.value = material.id;
    option.textContent = material.id;
    select.appendChild(option);
  }

  // Preserve the selected target when it still exists.
  if (
    targetMaterial !== undefined &&
    remainingMaterials.some((material) => material.id === targetMaterial.id)
  ) {
    select.value = targetMaterial.id;
  } else {
    select.selectedIndex = 0;
  }

  const sourcedList = parent.querySelector<HTMLUListElement>('#sourced-material-list');
  if (sourcedList === null) {
    return;
  }
  sourcedList.replaceChildren();
  for (const material of state.craftingTree.sourcedMaterials) {
    const sourcedItem = document.createElement('li');
    const itemContainer = document.createElement('div');
    itemContainer.className = 'sourced-material-container';
    const removeSourcedItemButton = document.createElement('button');
    removeSourcedItemButton.type = 'button';
    removeSourcedItemButton.textContent = 'X';
    removeSourcedItemButton.id = `remove-sourced-${material.id}`;
    itemContainer.append(removeSourcedItemButton);
    const text = document.createElement('div');
    text.textContent = material.name;
    itemContainer.append(text);
    sourcedItem.append(itemContainer);
    sourcedList.append(sourcedItem);
  }
}

function updateRemoveSourcedMaterial(state: AppState, id: string): AppState {
  const originalItems = state.craftingTree.sourcedMaterials;
  const index = originalItems.findIndex((material) => id === `remove-sourced-${material.id}`);
  if (index === -1) {
    return state;
  }

  return {
    ...state,
    craftingTree: {
      ...state.craftingTree,
      sourcedMaterials: [...originalItems.slice(0, index), ...originalItems.slice(index + 1)],
    },
  };
}

// TODO: combine the initialization for sourced stuff
function initializeSourcedMaterialButtons(): void {
  const sourcedMaterials = document.querySelector<HTMLDivElement>('.sourced-materials');
  sourcedMaterials?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const parent = target.closest<HTMLElement>('.sourced-material-container');
    if (parent === null) {
      return;
    }

    const newState = updateRemoveSourcedMaterial(GLOBAL_STATE, target.id);
    update(newState);
  });
}

function initializeSourcedMaterialSelect(): void {
  const sourcedMaterialSelect = document.querySelector<HTMLSelectElement>(
    '#sourced-material-select',
  );
  sourcedMaterialSelect?.addEventListener('change', () => {
    const newState = updateSourcedMaterialSelect(GLOBAL_STATE, sourcedMaterialSelect.value);
    update(newState);
  });
}

function initializeAddSourcedMaterialButton(): void {
  const sourcedMaterialButton = document.querySelector<HTMLButtonElement>('#add-sourced-material');
  const sourcedMaterialSelect = document.querySelector<HTMLSelectElement>(
    '#sourced-material-select',
  );
  if (sourcedMaterialSelect === null) {
    return;
  }
  sourcedMaterialButton?.addEventListener('click', () => {
    const newState = updateSourcedMaterialList(GLOBAL_STATE, sourcedMaterialSelect.value);
    update(newState);
  });
}

function updateSourcedMaterialList(state: AppState, selectedTarget: string): AppState {
  const matchingMaterial = state.gameData.materialData.data.find((m) => m.id === selectedTarget);
  if (matchingMaterial !== undefined) {
    return {
      ...state,
      craftingTree: {
        ...state.craftingTree,
        selectedSourcedMaterial: undefined,
        sourcedMaterials: [...state.craftingTree.sourcedMaterials, matchingMaterial],
      },
    };
  } else {
    return state;
  }
}

function updateSourcedMaterialSelect(state: AppState, selectedTarget: string): AppState {
  const matchingMaterial = state.gameData.materialData.data.find((m) => m.id === selectedTarget);
  if (matchingMaterial !== undefined) {
    return {
      ...state,
      craftingTree: { ...state.craftingTree, selectedSourcedMaterial: matchingMaterial },
    };
  } else {
    return state;
  }
}

// TODO: add removal of sourced items
