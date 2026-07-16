export type TimeStyle = "t" | "T" | "d" | "D" | "f" | "F" | "R";

export function unix(value: Date | number = Date.now()): number {
  const seconds = value instanceof Date
    ? value.getTime() / 1_000
    : value > 10_000_000_000 ? value / 1_000 : value;
  return Math.floor(seconds);
}

export function duration(input: string): number {
  const value = input.trim().toLowerCase();
  if (/^\d+$/.test(value)) return Number(value) * 1_000;

  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 } as const;
  const parts = [...value.matchAll(/(\d+(?:\.\d+)?)\s*([smhdw])/g)];
  if (!parts.length || parts.map(part => part[0]).join("") !== value.replaceAll(" ", "")) return 0;
  return Math.round(parts.reduce((total, part) => total + Number(part[1]) * units[part[2] as keyof typeof units], 0));
}

export function time(value: Date | number = Date.now(), style: TimeStyle = "F"): string {
  return `<t:${unix(value)}:${style}>`;
}
