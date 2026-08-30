import { Recipe as RecipeNew } from '../api-access';

export function formatAmount(amount: number) {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatAmountNew(amount: number) {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatPercentNew(value: number) {
  return `${formatAmount(value * 100)}%`;
}

export function formatRecipeNew(recipe: RecipeNew) {
  const inputs = recipe.inputs
    .map((input) => `${formatAmount(input.qty)}x ${input.material}`)
    .join(' + ');

  const tmp = [`${formatAmount(recipe.output.qty)}x ${recipe.output.material}`];
  if (recipe.byproduct) {
    tmp.push(`${formatAmount(recipe.byproduct.qty)}x ${recipe.byproduct.material}`);
  }
  const outputs = tmp.join(' + ');

  return `[${inputs}] => [${outputs}]`;
}
