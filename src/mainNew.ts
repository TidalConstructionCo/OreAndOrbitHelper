import GAME_DATA, { ExtractionRecipe } from './crafting-data';
import { getApiKey, initialize as initializeApiKeyPage } from './api-key.js';
import { renderCraftingTree } from './ui/crafting-tree';
import { buildCraftingTree } from './domain/crafting-tree';
import { renderSummary } from './ui/summary';
import { initializeToolTabs } from './ui/tool-tabs';
import { initializeTargetSelector } from './ui/target-selector';
import { renderExtractorSettings } from './ui/extractor-settings';
import {
  ExtractionResponse,
  ExtractionResponseSchema,
  getExtraction,
  getMaterials,
  getRecipes,
  MaterialsResponse,
  MaterialsResponseSchema,
  RecipesResponse,
  RecipesResponseSchema,
} from './api-access';
import { CACHE_KEYS, loadCache, saveToCache } from './cache';
// TODO: remove aliases
import { AppState, createInitialState, MaterialId } from './app/newState';

// new state stuff here
// TODO: check if I need the let or can do it differently
let GLOBAL_STATE = createInitialState();
function update(newState: AppState) {
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
      materialData: cachedMaterials ? cachedMaterials.data : state.gameData.materialData,
      recipeData: cachedRecipes ? cachedRecipes.data : state.gameData.recipeData,
      extractionData: cachedExtraction ? cachedExtraction.data : state.gameData.extractionData,
    },
  };
}

function loadApiKey(state: AppState): AppState {
  const key = getApiKey();
  return { ...state, settings: { ...state.settings, apiKey: key ? key : state.settings.apiKey } };
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

function updateSelectedTarget(state: AppState): AppState {
  return { ...state };
}

function initializeTargetSelect(): void {
  const targetSelect = document.querySelector<HTMLSelectElement>('#target-select');
  // TODO: re-add the building of the elements to render(?)
  // if (!targetSelect) {
  //   return;
  // }

  // initializeTargetSelector({
  //   select: targetSelect,
  //   materials: GAME_DATA.materials,
  //   selectedTarget: GLOBAL_STATE.selectedTarget,
  //   onTargetChanged: (target) => {
  //     GLOBAL_STATE.selectedTarget = target;
  //     render();
  //   },
  // });
  targetSelect?.addEventListener('change', () => {
    const newState = updateSelectedTarget(GLOBAL_STATE);
    update(newState);
  });
}

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

  // TODO
  initializeToolTabs();
  // TODO
  initializeApiKeyPage();

  update(newState);
}

// end new state stuff

function renderToolAvailability(): void {
  const configurationPanel = document.getElementById('configuration');

  document.querySelectorAll<HTMLElement>('.tool-panel').forEach((panel) => {
    if (panel === configurationPanel) {
      return;
    }

    const unavailableMessage = panel.querySelector<HTMLElement>('.tool-unavailable');

    const toolContent = panel.querySelector<HTMLElement>('.tool-content');

    if (!unavailableMessage || !toolContent) {
      return;
    }

    const ready = isGameDataReady();

    unavailableMessage.hidden = ready;
    toolContent.hidden = !ready;
  });
}

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

  // TODO: verify. THis is an attempt to avoid having a listener per element.
  extractorSettings?.addEventListener('input', (event) => {
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

function render() {
  renderToolAvailability();
  if (!isGameDataReady()) {
    return;
  }

  if (GLOBAL_STATE.selectedTarget) {
    const treeElement = document.getElementById('tree');
    const tree = buildCraftingTree(
      GAME_DATA.extractionRecipes,
      GLOBAL_STATE.materialAvailability,
      GLOBAL_STATE.selectedTarget,
      GLOBAL_STATE,
      GAME_DATA.recipes,
    );

    console.log({
      selectedTarget: GLOBAL_STATE.selectedTarget,
      recipeCount: GAME_DATA.recipes.length,
      recipes: GAME_DATA.recipes,
      tree,
    });

    if (treeElement) {
      renderCraftingTree({
        treeElement,
        rootNode: tree.root,
        recipeChoices: GLOBAL_STATE.recipeChoices,
        searchText: GLOBAL_STATE.searchText,
        recipes: GAME_DATA.recipes,
        onRecipeChoiceChanged: (material, recipeIndex) => {
          GLOBAL_STATE.recipeChoices.set(material, recipeIndex);
          render();
        },
      });
    }

    const summary = document.getElementById('summary');
    if (summary) {
      renderSummary(tree, summary);
    }

    initializeExtractorSettings();
  }
}

function refreshAllDisplays(): void {
  if (!GAME_DATA.materials.includes(GLOBAL_STATE.selectedTarget)) {
    GLOBAL_STATE.selectedTarget = GAME_DATA.materials[0] ?? '';
  }

  initializeTargetSelect();
  initializeExtractorSettings();
  render();
}

initialize();

// TODO: remove the alerts
