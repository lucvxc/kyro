const patterns = new Map<string, RegExp>();

export function compact(value: number): string {
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}m`;
  if (value >= 1_000) return `${trim(value / 1_000)}k`;
  return String(value);
}

export function fill(
  input: string,
  values: Readonly<Record<string, string | number>>,
): string {
  let output = input;
  for (const [key, value] of Object.entries(values)) {
    const pattern = patterns.get(key) ?? new RegExp(escape(key), "gi");
    patterns.set(key, pattern);
    output = output.replace(pattern, String(value));
  }
  return output;
}

export function codes<T>(
  values: Iterable<T>,
  format: (value: T) => string = (value) => String(value),
): string {
  return [...values]
    .map((value) => `\`${format(value).replaceAll("`", "\\`")}\``)
    .join(" · ");
}

export function groups<T, K>(
  values: Iterable<T>,
  by: (value: T) => K,
  format: (key: K, values: T[]) => string,
): string {
  return [...Map.groupBy(values, by)]
    .map(([key, items]) => format(key, items))
    .join("\n\n");
}

export const mention = Object.freeze({
  user: (id: string) => `<@${id}>`,
  role: (id: string) => `<@&${id}>`,
  channel: (id: string) => `<#${id}>`,
});

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}
function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
