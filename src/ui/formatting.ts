import type { Recipe as RecipeNew } from '../api-access';

export function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatAmountNew(amount: number): string {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatPercentNew(value: number): string {
  return `${formatAmount(value * 100)}%`;
}

export function formatRecipeNew(recipe: RecipeNew): string {
  const inputs = recipe.inputs
    .map((input) => `${formatAmount(input.qty)}x ${input.material}`)
    .join(' + ');

  const tmp = [`${formatAmount(recipe.output.qty)}x ${recipe.output.material}`];
  if (recipe.byproduct !== null) {
    tmp.push(`${formatAmount(recipe.byproduct.qty)}x ${recipe.byproduct.material}`);
  }
  const outputs = tmp.join(' + ');

  return `[${inputs}] => [${outputs}]`;
}
