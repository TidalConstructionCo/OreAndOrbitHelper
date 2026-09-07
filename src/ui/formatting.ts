export function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatPercent(value: number): string {
  return `${formatAmount(value * 100)}%`;
}
