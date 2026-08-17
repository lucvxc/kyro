export type ImageInput = string | Uint8Array;

const colors = new Map<string, string>();
let sharp: Promise<typeof import("sharp").default> | undefined;

export async function dominant(
  input: ImageInput,
  fallback = "#5865F2",
): Promise<string> {
  if (typeof input === "string") {
    const cached = colors.get(input);
    if (cached) return cached;
  }

  try {
    const source = await sourceFor(input);
    const image = await (sharp ??= import("sharp").then(
      (module) => module.default,
    ));
    const { data } = await image(source)
      .resize(72, 72, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const buckets = new Map<
      number,
      {
        score: number;
        weight: number;
        red: number;
        green: number;
        blue: number;
      }
    >();

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]!;
      if (alpha < 32) continue;
      const red = data[index]!;
      const green = data[index + 1]!;
      const blue = data[index + 2]!;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max ? (max - min) / max : 0;
      const brightness = max / 255;
      const weight = alpha / 255;
      const score =
        weight * (0.4 + saturation * 0.6) * (0.55 + brightness * 0.45);
      const key = ((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4);
      const bucket = buckets.get(key) ?? {
        score: 0,
        weight: 0,
        red: 0,
        green: 0,
        blue: 0,
      };
      bucket.score += score;
      bucket.weight += weight;
      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;
      buckets.set(key, bucket);
    }

    const selected = [...buckets.values()].sort(
      (left, right) => right.score - left.score,
    )[0];
    if (!selected) return fallback;
    const color = `#${[selected.red, selected.green, selected.blue]
      .map((value) =>
        Math.round(value / selected.weight)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()}`;
    if (typeof input === "string") remember(input, color);
    return color;
  } catch {
    return fallback;
  }
}

async function sourceFor(input: ImageInput): Promise<ImageInput> {
  if (typeof input !== "string") return input;
  if (/^https?:\/\//i.test(input)) return download(input);
  const data = input.match(/^data:[^;,]+;base64,(.+)$/i)?.[1];
  return data ? new Uint8Array(Buffer.from(data, "base64")) : input;
}

async function download(input: string) {
  const url = new URL(input);
  if (url.searchParams.has("size")) url.searchParams.set("size", "256");
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok)
        throw new Error(`Image request failed with ${response.status}.`);
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function remember(url: string, color: string) {
  colors.set(url, color);
  if (colors.size > 500) colors.delete(colors.keys().next().value!);
}
