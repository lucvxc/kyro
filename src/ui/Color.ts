export type Color = string | number;

export function color(value: Color): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffff) {
      throw new RangeError("Colors must be a 24-bit integer or hex value.");
    }

    return value;
  }

  const hex = value.trim().replace(/^#|^0x/i, "");
  const normalized = hex.length === 3 ? hex.replace(/./g, (part) => part + part) : hex;

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    throw new TypeError(`Invalid color "${value}". Use a 3 or 6 digit hex value.`);
  }

  return Number.parseInt(normalized, 16);
}
