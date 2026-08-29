export type AppState = {
  selectedTarget: string;
  searchText: string;
  recipeChoices: Map<string, number>;
  materialAvailability: Record<string, number>;
};
