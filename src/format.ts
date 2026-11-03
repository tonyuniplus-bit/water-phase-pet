export function formatKJ(joules: number): string {
  const kj = Math.abs(joules) / 1000;
  const rounded = Math.round(kj * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) return String(Math.round(rounded));
  return rounded.toFixed(1);
}

export function formatTemp(celsius: number): string {
  const rounded = Math.round(Math.abs(celsius) * 10) / 10;
  const body =
    Math.abs(rounded - Math.round(rounded)) < 1e-6 ? String(Math.round(rounded)) : rounded.toFixed(1);
  return `${celsius < 0 ? "−" : ""}${body}°C`;
}

export function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function formatSpecificHeat(joulesPerKgC: number): string {
  return (joulesPerKgC / 1000).toFixed(1);
}

export function formatLatent(joulesPerKg: number): string {
  return formatKJ(joulesPerKg);
}
