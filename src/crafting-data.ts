export interface MaterialAmount {
  material: string;
  amount: number;
}

export interface Recipe {
  name: string;
  duration: number;
  inputs: MaterialAmount[];
  outputs: MaterialAmount[];
}
