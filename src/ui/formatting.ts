import { Recipe } from '../crafting-data'

export function formatAmount(amount: number) {
  if (Number.isInteger(amount)) {
    return String(amount)
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatPercent(value: number) {
  return `${formatAmount(value * 100)}%`
}

export function formatRecipe(recipe: Recipe) {
  const inputs = recipe.inputs
    .map((input) => `${formatAmount(input.amount)}x ${input.material}`)
    .join(' + ')

  const outputs = recipe.outputs
    .map((output) => `${formatAmount(output.amount)}x ${output.material}`)
    .join(' + ')

  return `[${inputs}] => [${outputs}]`
}
