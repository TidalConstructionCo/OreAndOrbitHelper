import { Material } from '../api-access';

type TabId = 'crafting-tree' | 'settings';
type Settings = { apiKey: string | undefined };

// TODO: move
type MaterialId = string;
type CraftingTreeState = {
  searchText: string | undefined;
  extractionYields: Record<MaterialId, number>;
  targetMaterial: Material | undefined;
};
export type AppState = {
  selectedTab: TabId;
  settings: Settings;
  craftingTree: CraftingTreeState;
};

export function createInitialState(): AppState {
  return {
    selectedTab: 'crafting-tree',
    settings: { apiKey: undefined },
    craftingTree: { searchText: undefined, extractionYields: {}, targetMaterial: undefined },
  };
}
