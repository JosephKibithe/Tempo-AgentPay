export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatLatency(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`;
  }

  return `${Math.round(value)}ms`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
