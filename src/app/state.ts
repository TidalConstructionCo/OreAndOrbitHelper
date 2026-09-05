import type {
  BuildingsResponse,
  ExtractionResponse,
  Material,
  MaterialsResponse,
  RecipesResponse,
} from '../api-access';
import type {
  ForcedRecipe as RecipeOverrides,
  RecipeChoices,
} from '../domain/craftingTree/craftingTree';

export type TabId = 'crafting-tree' | 'settings';
// TODO: use apiKeyInput in event handler update function instead of dom element. Or is it useless?
type Settings = { storedApiKey: string | undefined; apiKeyInput: string };

// TODO: move
export type MaterialId = string;
type CraftingTreeState = {
  searchText: string | undefined;
  // TODO: maybe choose a better type?
  extractionYields: Record<MaterialId, number>;
  targetMaterial: Material | undefined;
  recipeChoices: RecipeChoices;
  sourcedMaterials: Material[];
  selectedSourcedMaterial: Material | undefined;
  recipeOverrides: RecipeOverrides;
};

export type GameData = {
  // TODO: replace with actual domain types that get created from those?
  materialData: MaterialsResponse;
  recipeData: RecipesResponse;
  extractionData: ExtractionResponse;
  buildingData: BuildingsResponse;
};

export type AppState = {
  selectedTab: TabId;
  settings: Settings;
  craftingTree: CraftingTreeState;
  gameData: GameData;
};

export function createInitialState(): AppState {
  return {
    selectedTab: 'crafting-tree',
    settings: { storedApiKey: undefined, apiKeyInput: '' },
    craftingTree: {
      searchText: undefined,
      extractionYields: {},
      targetMaterial: undefined,
      recipeChoices: new Map(),
      sourcedMaterials: [],
      selectedSourcedMaterial: undefined,
      recipeOverrides: [],
    },
    gameData: {
      // TODO: maybe omit the brackets
      extractionData: { data: [] },
      materialData: { data: [] },
      recipeData: { data: [] },
      buildingData: { data: [] },
    },
  };
}
