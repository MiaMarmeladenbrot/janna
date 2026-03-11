export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatEuroShort(amount: number): string {
  // Format like "€ 2000,-" for even amounts, "€ 2380,50" for fractions
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = rounded === Math.floor(rounded);
  if (isWhole) {
    return `€ ${Math.floor(rounded).toLocaleString('de-DE')},-`;
  }
  return `€ ${rounded.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
