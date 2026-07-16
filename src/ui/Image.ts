export type ImageInput = string | Uint8Array;
const colors = new Map<string, string>();
let sharp: Promise<typeof import("sharp").default> | undefined;

export async function dominant(input: ImageInput, fallback = "#5865F2"): Promise<string> {
  if (typeof input === "string") {
    const cached = colors.get(input);
    if (cached) return cached;
  }

  try {
    let source = input;
    if (typeof input === "string" && /^https?:\/\//i.test(input)) {
      const url = new URL(input);
      if (url.searchParams.has("size")) url.searchParams.set("size", "128");
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Image request failed with ${response.status}.`);
      source = new Uint8Array(await response.arrayBuffer());
    }
    const image = await (sharp ??= import("sharp").then(module => module.default));
    const stats = await image(source).resize(64, 64, { fit: "inside" }).stats();
    const { r, g, b } = stats.dominant;
    const color = `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    if (typeof input === "string") {
      colors.set(input, color);
      if (colors.size > 500) colors.delete(colors.keys().next().value!);
    }
    return color;
  } catch (error) {
    return fallback;
  }
}
