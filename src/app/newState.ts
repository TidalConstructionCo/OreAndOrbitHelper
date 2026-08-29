import { ExtractionResponse, Material, MaterialsResponse, RecipesResponse } from '../api-access';

type TabId = 'crafting-tree' | 'settings';
type Settings = { apiKey: string | undefined };

// TODO: move
export type MaterialId = string;
type CraftingTreeState = {
  searchText: string | undefined;
  extractionYields: Record<MaterialId, number>;
  targetMaterial: Material | undefined;
};

type GameData = {
  // TODO: replace with actual domain types that get created from those?
  materialData: MaterialsResponse;
  recipeData: RecipesResponse;
  extractionData: ExtractionResponse;
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
    settings: { apiKey: undefined },
    craftingTree: { searchText: undefined, extractionYields: {}, targetMaterial: undefined },
    gameData: {
      // TODO: maybe omit the brackets
      extractionData: { data: [] },
      materialData: { data: [] },
      recipeData: { data: [] },
    },
  };
}
