export function formatNumber(n) {
  const abs = Math.abs(n);
  if (abs < 1000) return n.toFixed(1);
  if (abs < 1_000_000) return `${(n / 1_000).toFixed(1)}k`;
  if (abs < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000_000_000).toFixed(1)}B`;
}
