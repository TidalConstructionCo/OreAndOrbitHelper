// TODO: next: remove the old main script & now unneeded info
// TODO: other todos
/**
 * - change based rendering
 * - overclocking and underclocking
 * - searchable target selector
 * - clean up tree logic => lots of info that should probably not live on the nodes
 * - clean up where are ids, strings, objects used and what should it actually be
 * - fix error in craftingTreeNew
 */
import { API_KEY_STORAGE_KEY, getApiKey, initializeApiPageNew } from './api-key.js';
import { buildCraftingTreeNew } from './domain/craftingTreeNew';
import { renderSummaryNew } from './ui/summary';
import {
  ExtractionResponseSchema,
  getExtraction,
  getMaterials,
  getRecipes,
  MaterialsResponseSchema,
  RecipesResponseSchema,
} from './api-access';
import { CACHE_KEYS, loadCache, saveToCache } from './cache';
// TODO: remove aliases
import { AppState, createInitialState, MaterialId, TabId } from './app/newState';
import { getElementIdForMaterial } from './ui/utils';
import { renderCraftingTreeNew } from './ui/craftingTreeNew';

// new state stuff here
// TODO: check if I need the let or can do it differently
let GLOBAL_STATE = createInitialState();
const buttons = document.querySelectorAll<HTMLElement>('.tool-button');
function update(newState: AppState) {
  GLOBAL_STATE = newState;
  renderNew();
}

// TODO: probably move somewhere else (domain)?
function loadCachedGameData(state: AppState): AppState {
  const cachedMaterials = loadCache(CACHE_KEYS.materials, MaterialsResponseSchema);
  const cachedRecipes = loadCache(CACHE_KEYS.recipes, RecipesResponseSchema);
  const cachedExtraction = loadCache(CACHE_KEYS.locations, ExtractionResponseSchema);

  return {
    ...state,
    gameData: {
      materialData: cachedMaterials ? cachedMaterials.data : state.gameData.materialData,
      recipeData: cachedRecipes ? cachedRecipes.data : state.gameData.recipeData,
      extractionData: cachedExtraction ? cachedExtraction.data : state.gameData.extractionData,
    },
  };
}

function loadApiKey(state: AppState): AppState {
  const key = getApiKey();
  return {
    ...state,
    settings: { ...state.settings, storedApiKey: key ? key : state.settings.storedApiKey },
  };
}

async function updateGameData(state: AppState): Promise<AppState> {
  // TODO: add "failed to fetch api data" to app state
  // TODO: fix display name of materials
  const result = { ...state };
  const materialApiResult = await getMaterials();
  // TODO: streamline, almost duplicated to the cache load case
  if (materialApiResult) {
    result.gameData.materialData = materialApiResult;
    saveToCache(CACHE_KEYS.materials, materialApiResult);
  }

  const recipeApiResult = await getRecipes();
  if (recipeApiResult) {
    result.gameData.recipeData = recipeApiResult;
    saveToCache(CACHE_KEYS.recipes, recipeApiResult);
  }

  const extractionApiResult = await getExtraction();
  if (extractionApiResult) {
    result.gameData.extractionData = extractionApiResult;
    saveToCache(CACHE_KEYS.locations, extractionApiResult);
  }

  return result;
}

function initializeReloadDataButton() {
  // TODO: rename
  const updateMaterialsButton = document.querySelector<HTMLButtonElement>('#reload-game-data');
  if (updateMaterialsButton) {
    updateMaterialsButton.addEventListener('click', async () => {
      updateMaterialsButton.disabled = true;

      // TODO: maybe can clean out the try-catch?
      try {
        const newState = await updateGameData(GLOBAL_STATE);
        update(newState);
        // TODO: still needed?
        // refreshAllDisplays();
      } finally {
        updateMaterialsButton.disabled = false;
      }
    });
  }
}

function updateSearchText(state: AppState, searchText: string): AppState {
  return { ...state, craftingTree: { ...state.craftingTree, searchText } };
}

function initializeSearchButton() {
  const searchInput = document.querySelector<HTMLInputElement>('#tree-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const newState = updateSearchText(GLOBAL_STATE, searchInput.value);
      update(newState);
    });
  }
}

function initializeResizeHandler() {
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
  if (matchingMaterial) {
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
  if (!selectedTab) {
    return state;
  }

  return { ...state, selectedTab };
}

export function initializeToolTabsNew(): void {
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedTool = button.dataset.tool;

      const newState = updateSelectedTab(
        GLOBAL_STATE,
        // TODO: this is a bit ugly
        selectedTool ? (selectedTool as TabId) : undefined,
      );
      update(newState);

      // TODO: do this in render
      // buttons.forEach((item) => {
      //   item.classList.toggle('active', item === button);
      // });

      // panels.forEach((panel) => {
      //   panel.classList.toggle('active', panel.id === selectedTool);
      // });
    });
  });
}

// TODO: handle all the optionals from query selectors

function updateApiKey(state: AppState, newKey: string | undefined): AppState {
  return { ...state, settings: { ...state.settings, storedApiKey: newKey } };
}

// TODO: initialize should be done, all handlers wired up(?) => now we need to update the render function(s).

function initialize() {
  // TODO: if not cached data but have key => query?
  // TODO: maybe group the cache loading?
  let newState = { ...GLOBAL_STATE };
  newState = loadApiKey(newState);
  newState = loadCachedGameData(newState);

  initializeReloadDataButton();
  initializeSearchButton();
  initializeTargetSelect();
  initializeExtractorSettings();
  initializeToolTabsNew();
  initializeApiPageNew(
    (event: SubmitEvent): void => {
      // TODO: maybe trim down what parts of the handler need to live here and what can be added at the implementation site
      event.preventDefault();
      // TODO: get query selector out of here? also handle null. question mark for now
      const input = document.querySelector<HTMLInputElement>('#apiKeyInput');

      if (!input) {
        return;
      }
      const apiKey = input.value.trim();

      if (!apiKey) {
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
function initializeExtractorSettings(): void {
  const extractorSettings = document.querySelector<HTMLElement>('.extractor-settings');

  // extractorSettings?.addEventListener('input', (event) => {
  // TODO: using change for now so I don't rerender while dragging.
  // Later, I should do change based rendering so I can still update the relevant numbers (slider level and extractor count) while dragging
  extractorSettings?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.type !== 'range') {
      return;
    }

    const child = target.closest<HTMLElement>('.extractor-setting');
    if (!child) {
      return;
    }

    const newState = updateAvailability(GLOBAL_STATE, target.name, Number(target.value));
    update(newState);
  });
}

function renderToolbar(state: AppState) {
  const buttons = document.querySelectorAll<HTMLElement>('.tool-button');
  const panels = document.querySelectorAll<HTMLElement>('.tool-panel');

  const selectedTool = state.selectedTab;
  buttons.forEach((button) => {
    button.classList.toggle('active', selectedTool === button.dataset.tool);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === selectedTool);
  });
}

function isGameDataReady(state: AppState): boolean {
  // TODO: get a better way to determine
  return (
    state.gameData.materialData.data.length > 0 &&
    state.gameData.recipeData.data.length > 0 &&
    state.gameData.extractionData.data.length > 0
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
  state: AppState,
  storedKeyContainer: HTMLDivElement,
  removeButton: HTMLButtonElement,
  keyValue: HTMLElement,
): void {
  const VISIBLE_CHARACTERS = 4;
  const apiKey: string | undefined = state.settings.storedApiKey;
  const hasStoredKey: boolean = Boolean(apiKey);

  storedKeyContainer.hidden = !hasStoredKey;
  removeButton.hidden = !hasStoredKey;

  if (apiKey) {
    keyValue.textContent = obfuscateApiKey(apiKey, VISIBLE_CHARACTERS);
  } else {
    keyValue.textContent = '';
  }
}

function renderSettingsTab(state: AppState, parent: HTMLElement) {
  const storedKeyContainer = parent.querySelector<HTMLDivElement>('#storedKey');
  const keyValue = parent.querySelector<HTMLElement>('#keyValue');
  const removeButton = parent.querySelector<HTMLButtonElement>('#removeKeyButton');

  if (!storedKeyContainer || !keyValue || !removeButton) {
    throw new Error('Required DOM elements were not found.');
  }

  renderStoredKey(state, storedKeyContainer, removeButton, keyValue);
}

function renderMaterialSelect(state: AppState, select: HTMLSelectElement) {
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
  if (targetMaterial && materials.some((material) => material.id === targetMaterial.id)) {
    select.value = targetMaterial.id;
  } else {
    select.selectedIndex = 0;
  }

  // select.onchange = () => {
  //   onTargetChanged(select.value);
  // };
}

function renderCraftingTreeInputs(state: AppState) {
  // TODO: render material select
  const targetSelect = document.querySelector<HTMLSelectElement>('#target-select');
  if (targetSelect) {
    renderMaterialSelect(state, targetSelect);
  }
  // TODO: render search bar => not needed?
}

function renderCraftingTreeContent(state: AppState, parent: HTMLElement) {
  const treeElement = parent.querySelector<HTMLDivElement>('.tree');
  if (!treeElement) {
    // TODO: shouldnt happen
    return;
  }

  renderCraftingTreeInputs(state);
  const tree = buildCraftingTreeNew(state);
  // TODO: fix render tree
  if (!tree) {
    return;
  }
  renderCraftingTreeNew(
    treeElement,
    tree.root,
    // GLOBAL_STATE.recipeChoices,
    state.craftingTree.searchText ?? '',
    state.gameData.recipeData.data,
    // (material, recipeIndex) => {
    () => {
      // GLOBAL_STATE.recipeChoices.set(material, recipeIndex);
      update(state);
    },
  );
  // render extraction settings
  const extractorSettingsContainer = parent.querySelector<HTMLElement>('.extractor-settings');
  if (extractorSettingsContainer) {
    renderExtractorSettingsNew(state, extractorSettingsContainer);
  }
  const summary = document.getElementById('summary');
  if (summary) {
    // TODO: fix impl of render summary
    renderSummaryNew(tree, summary);
  }
}

function renderCraftingTreeTab(state: AppState, parent: HTMLElement) {
  const unavailableMessage = parent.querySelector<HTMLElement>('.tool-unavailable');
  const toolContent = parent.querySelector<HTMLElement>('.tool-content');

  if (!unavailableMessage || !toolContent) {
    return;
  }

  const ready = isGameDataReady(state);
  unavailableMessage.hidden = ready;
  toolContent.hidden = !ready;
  if (ready) {
    renderCraftingTreeContent(state, toolContent);
  }
}

function renderSelectedTool(state: AppState) {
  let selectedPanel: HTMLElement | undefined;

  document.querySelectorAll<HTMLElement>('.tool-panel').forEach((panel) => {
    const isSelected = panel.id === state.selectedTab;

    panel.hidden = !isSelected;

    if (isSelected) {
      selectedPanel = panel;
    }
  });

  if (!selectedPanel) {
    return;
  }

  switch (state.selectedTab) {
    case 'crafting-tree':
      renderCraftingTreeTab(state, selectedPanel);
      break;

    case 'settings':
      renderSettingsTab(state, selectedPanel);
      break;

    default: {
      const exhaustiveCheck: never = state.selectedTab;
      console.log(exhaustiveCheck);
    }
  }
}

//  renderExtractorSettings({
//     container: extractorSettings,
//     materials: Object.keys(state.materialAvailability),
//     availability: state.materialAvailability,
//     onAvailabilityChanged: (material, value) => {
//       state.materialAvailability[material] = value;
//       render();
//     },
//   });

export function renderExtractorSettingsNew(state: AppState, parent: HTMLElement): void {
  parent.replaceChildren();

  for (const material of state.gameData.extractionData.data.map((e) => e.material)) {
    // for (const material of Object.keys(state.craftingTree.extractionYields)) {
    const id = getElementIdForMaterial(material);
    const value = state.craftingTree.extractionYields[material] ?? 1;

    const wrapper = document.createElement('div');
    wrapper.className = 'extractor-setting';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = material;

    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.name = material;
    input.min = '1';
    input.max = '10';
    input.step = '1';
    input.value = String(value);

    const output = document.createElement('output');
    output.id = `${id}-value`;
    output.textContent = String(value);

    wrapper.append(label, input, output);
    parent.appendChild(wrapper);
  }
}

// TODO
function renderNew() {
  // TODO: pass more concrete stuff than the full object
  renderToolbar(GLOBAL_STATE);
  renderSelectedTool(GLOBAL_STATE);
}

initialize();
