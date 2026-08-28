import GAME_DATA, { ExtractionRecipe } from './crafting-data'
import { getApiKey, initialize as initializeApiKeyPage } from './api-key.js'
import { renderCraftingTree } from './ui/crafting-tree'
import { buildCraftingTree } from './domain/crafting-tree'
import { createInitialState } from './app/state'
import { renderSummary } from './ui/summary'
import { initializeToolTabs } from './ui/tool-tabs'
import { initializeTargetSelector } from './ui/target-selector'
import { renderExtractorSettings } from './ui/extractor-settings'
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
} from './api-access'
import { CACHE_KEYS, loadCache, saveToCache } from './cache'

const state = createInitialState()

let hasMaterialsData = false
let hasRecipesData = false
let hasExtractionData = false

function isGameDataReady(): boolean {
  return hasMaterialsData && hasRecipesData && hasExtractionData // || getApiKey() !== undefined;
}

function renderToolAvailability(): void {
  const configurationPanel = document.getElementById('configuration')

  document.querySelectorAll<HTMLElement>('.tool-panel').forEach((panel) => {
    if (panel === configurationPanel) {
      return
    }

    const unavailableMessage = panel.querySelector<HTMLElement>('.tool-unavailable')

    const toolContent = panel.querySelector<HTMLElement>('.tool-content')

    if (!unavailableMessage || !toolContent) {
      return
    }

    const ready = isGameDataReady()

    unavailableMessage.hidden = ready
    toolContent.hidden = !ready
  })
}

export function render() {
  renderToolAvailability()
  if (!isGameDataReady()) {
    return
  }

  if (state.selectedTarget) {
    const treeElement = document.getElementById('tree')
    const tree = buildCraftingTree(
      GAME_DATA.extractionRecipes,
      state.materialAvailability,
      state.selectedTarget,
      state,
      GAME_DATA.recipes,
    )

    console.log({
      selectedTarget: state.selectedTarget,
      recipeCount: GAME_DATA.recipes.length,
      recipes: GAME_DATA.recipes,
      tree,
    })

    if (treeElement) {
      renderCraftingTree({
        treeElement,
        rootNode: tree.root,
        recipeChoices: state.recipeChoices,
        searchText: state.searchText,
        recipes: GAME_DATA.recipes,
        onRecipeChoiceChanged: (material, recipeIndex) => {
          state.recipeChoices.set(material, recipeIndex)
          render()
        },
      })
    }

    const summary = document.getElementById('summary')
    if (summary) {
      renderSummary(tree, summary)
    }

    initializeExtractorSettings()
  }
}

function initializeTargetSelect(): void {
  const targetSelect = document.querySelector<HTMLSelectElement>('#target-select')
  if (!targetSelect) {
    return
  }

  initializeTargetSelector({
    select: targetSelect,
    materials: GAME_DATA.materials,
    selectedTarget: state.selectedTarget,
    onTargetChanged: (target) => {
      state.selectedTarget = target
      render()
    },
  })
}

function initializeExtractorSettings(): void {
  const extractorSettings = document.querySelector<HTMLElement>('.extractor-settings')
  console.log('initializingExtractor')
  if (!extractorSettings) {
    return
  }

  console.log()
  renderExtractorSettings({
    container: extractorSettings,
    materials: Object.keys(state.materialAvailability),
    availability: state.materialAvailability,
    onAvailabilityChanged: (material, value) => {
      state.materialAvailability[material] = value
      render()
    },
  })
}

function refreshAllDisplays(): void {
  if (!GAME_DATA.materials.includes(state.selectedTarget)) {
    state.selectedTarget = GAME_DATA.materials[0] ?? ''
  }

  initializeTargetSelect()
  initializeExtractorSettings()
  render()
}

function initialize() {
  initializeToolTabs()
  initializeApiKeyPage()

  const cachedMaterials = loadCache(CACHE_KEYS.materials, MaterialsResponseSchema)
  if (cachedMaterials) {
    loadMaterials(cachedMaterials.data)
    hasMaterialsData = true
  }
  const cachedRecipes = loadCache(CACHE_KEYS.recipes, RecipesResponseSchema)
  if (cachedRecipes) {
    loadRecipes(cachedRecipes.data)
    hasRecipesData = true
  }
  const cachedExtraction = loadCache(CACHE_KEYS.locations, ExtractionResponseSchema)
  if (cachedExtraction) {
    loadExtraction(cachedExtraction.data)
    hasExtractionData = true
  }

  // TODO: rename
  const updateMaterialsButton = document.querySelector<HTMLButtonElement>('#reload-game-data')

  if (updateMaterialsButton) {
    updateMaterialsButton.addEventListener('click', async () => {
      updateMaterialsButton.disabled = true

      try {
        await updateGameData()
        refreshAllDisplays()
      } finally {
        updateMaterialsButton.disabled = false
      }
    })
  }

  initializeTargetSelect()

  const searchInput = document.querySelector<HTMLInputElement>('#tree-search')
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.searchText = searchInput.value
      render()
    })
  }

  initializeExtractorSettings()

  let resizeTimer: number | undefined
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)

    resizeTimer = setTimeout(() => {
      render()
    }, 100)
  })

  render()
}

initialize()

function loadMaterials(materialData: MaterialsResponse) {
  GAME_DATA.materials = materialData.data.map((r) => r.id)
}

function loadRecipes(recipeApiResult: RecipesResponse) {
  GAME_DATA.recipes = recipeApiResult.data.map((r) => {
    const inputs = r.inputs.map((i) => {
      return { material: i.material, amount: i.qty }
    })
    const outputs = [{ material: r.output.material, amount: r.output.qty }]
    const byproduct = r.byproduct
    if (byproduct) {
      outputs.push({ material: byproduct.material, amount: byproduct.qty })
    }
    return {
      inputs,
      outputs,
      duration: r.batch_minutes,
      name: r.id,
    }
  })
}

function loadExtraction(extractionData: ExtractionResponse) {
  const newExtraction: Record<string, ExtractionRecipe> = {}
  for (const recipe of extractionData.data) {
    newExtraction[recipe.material] = {
      amount: recipe.units_per_batch,
      duration: recipe.batch_minutes,
    }
  }
  GAME_DATA.extractionRecipes = newExtraction
  const newAvailability: Record<string, number> = Object.fromEntries(
    extractionData.data.map((res) => [res.material, state.materialAvailability[res.material] ?? 5]),
  )
  state.materialAvailability = newAvailability
  console.log(JSON.stringify(GAME_DATA.extractionRecipes, null, 2))
  console.log(JSON.stringify(state.materialAvailability, null, 2))
}

// TODO: remove the alerts

async function updateGameData() {
  // TODO: fix display name of materials
  const materialApiResult = await getMaterials()
  if (materialApiResult) {
    loadMaterials(materialApiResult)
    saveToCache(CACHE_KEYS.materials, materialApiResult)
    hasMaterialsData = true
  } else {
    alert('Failed to fetch API data. Try again later (5+ minutes from now).')
    return
  }

  const recipeApiResult = await getRecipes()
  if (recipeApiResult) {
    loadRecipes(recipeApiResult)
    saveToCache(CACHE_KEYS.recipes, recipeApiResult)
    hasRecipesData = true
  }

  const extractionApiResult = await getExtraction()
  if (extractionApiResult) {
    loadExtraction(extractionApiResult)
    saveToCache(CACHE_KEYS.locations, extractionApiResult)
    hasExtractionData = true
  }
}
