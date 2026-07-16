import type { Attachment, Client, Guild, GuildMember } from "discord.js";
import { UserError } from "../../index.ts";

export const fonts = {
  ggsans: 11,
  tempo: 12,
  sakura: 3,
  jellybean: 4,
  modern: 6,
  medieval: 7,
  eightbit: 8,
  vampyre: 10,
} as const;

export const effects = {
  solid: 1,
  gradient: 2,
  neon: 3,
  toon: 4,
  pop: 5,
} as const;

export interface Customization {
  nick?: string | null;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  display_name_font_id?: number | null;
  display_name_effect_id?: number | null;
  display_name_colors?: number[] | null;
}

export function hexToInt(hex: string): number {
  const value = hex.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(value)) throw new UserError(`Invalid hex color "${hex}".`);
  return parseInt(value, 16);
}

export function intToHex(int: number): string {
  return `#${int.toString(16).toUpperCase().padStart(6, "0")}`;
}

export function font(value?: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase() as keyof typeof fonts;
  const id = fonts[key] ?? Number(value);
  if (!Number.isInteger(id)) throw new UserError(`Unknown font "${value}".`);
  return id;
}

export function effect(value?: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase() as keyof typeof effects;
  const id = effects[key] ?? Number(value);
  if (!Number.isInteger(id)) throw new UserError(`Unknown effect "${value}".`);
  return id;
}

export function colors(value?: string | null): number[] | undefined {
  const parts = value?.split(/[,\s]+/).filter(Boolean) ?? [];
  return parts.length ? parts.map(hexToInt) : undefined;
}

export function styleColors(effectName?: string | null, first?: string | null, second?: string | null): number[] | undefined {
  const selected = [first, second].filter((hex): hex is string => Boolean(hex?.trim()));
  if (!selected.length) return undefined;
  if (effectName === "gradient") return colors([selected[0], selected[1] ?? selected[0]].join(" "));
  return colors(selected[0]);
}

export function imageURL(member: GuildMember, fallback?: string | null): string | undefined {
  return fallback?.trim() || member.client.user?.displayAvatarURL({ size: 4096, extension: "png" });
}

export async function image(value?: string | Attachment | null): Promise<string | undefined> {
  const url = typeof value === "string" ? value.trim() : value?.url;
  if (!url) return undefined;
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url);
  if (!response.ok) throw new UserError(`I could not download that image (${response.status}).`);

  const type = response.headers.get("content-type") ?? (typeof value === "string" ? null : value?.contentType) ?? "image/png";
  if (!type.startsWith("image/")) throw new UserError("That file is not an image.");

  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return `data:${type};base64,${data}`;
}

export async function customize(client: Client, guild: Guild, body: Customization): Promise<void> {
  if (!Object.keys(body).length) throw new UserError("Change at least one customization option.");

  try {
    await client.rest.patch(`/guilds/${guild.id}/members/@me`, { body });
  } catch (error) {
    throw new UserError(message(error));
  }
}

export function clean(body: Customization): Customization {
  return Object.fromEntries(Object.entries(body).filter(([, value]) =>
    value !== undefined && !(typeof value === "string" && !value.trim()))) as Customization;
}

function message(error: unknown): string {
  const raw = typeof error === "object" && error && "rawError" in error
    ? JSON.stringify(error.rawError)
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "Discord rejected that customization.";
  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}
