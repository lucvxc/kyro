import type { Attachment, Guild } from "discord.js";
import { UserError } from "../commands/Errors.ts";

export const botProfileFonts = {
  ggsans: 11,
  tempo: 12,
  sakura: 3,
  jellybean: 4,
  modern: 6,
  medieval: 7,
  eightbit: 8,
  vampyre: 10,
} as const;

export const botProfileEffects = {
  solid: 1,
  gradient: 2,
  neon: 3,
  toon: 4,
  pop: 5,
} as const;

export type BotProfileImage = string | Attachment | null;
export type BotProfileColor = string | number;
export type BotProfileFont = keyof typeof botProfileFonts | number;
export type BotProfileEffect = keyof typeof botProfileEffects | number;

export interface BotProfileStyle {
  font?: BotProfileFont | string | null;
  effect?: BotProfileEffect | string | null;
  colors?: BotProfileColor | readonly BotProfileColor[] | null;
}

export interface BotProfileUpdate {
  name?: string | null;
  avatar?: BotProfileImage;
  banner?: BotProfileImage;
  bio?: string | null;
  style?: BotProfileStyle | null;
}

interface DiscordProfileUpdate {
  nick?: string | null;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  display_name_font_id?: number | null;
  display_name_effect_id?: number | null;
  display_name_colors?: number[] | null;
}

export class BotProfile {
  readonly #guild: Guild;

  public constructor(guild: Guild) {
    this.#guild = guild;
  }

  public async update(options: BotProfileUpdate): Promise<void> {
    const body: DiscordProfileUpdate = {
      nick: present(options.name),
      avatar: await image(options.avatar),
      banner: await image(options.banner),
      bio: present(options.bio),
      ...style(options.style),
    };

    for (const key of Object.keys(body) as (keyof DiscordProfileUpdate)[]) {
      if (body[key] === undefined) delete body[key];
    }
    if (!Object.keys(body).length)
      throw new UserError("Change at least one bot profile option.");

    try {
      await this.#guild.client.rest.patch(
        `/guilds/${this.#guild.id}/members/@me`,
        { body },
      );
    } catch (error) {
      throw new UserError(discordMessage(error));
    }
  }

  public reset(): Promise<void> {
    return this.update({
      name: null,
      avatar: null,
      banner: null,
      bio: null,
      style: null,
    });
  }
}

function present(value?: string | null): string | null | undefined {
  return value === null ? null : value?.trim() || undefined;
}

async function image(
  value?: BotProfileImage,
): Promise<string | null | undefined> {
  if (value === null) return null;
  const url = typeof value === "string" ? value.trim() : value?.url;
  if (!url) return undefined;
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url);
  if (!response.ok)
    throw new UserError(
      `I could not download that image (${response.status}).`,
    );
  const type =
    response.headers.get("content-type") ??
    (typeof value === "string" ? null : value?.contentType) ??
    "image/png";
  if (!type.startsWith("image/"))
    throw new UserError("That file is not an image.");

  return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
}

function style(value?: BotProfileStyle | null): Partial<DiscordProfileUpdate> {
  if (value === undefined) return {};
  if (value === null) {
    return {
      display_name_font_id: null,
      display_name_effect_id: null,
      display_name_colors: null,
    };
  }

  const effect = id(value.effect, botProfileEffects, "effect");
  let colors = profileColors(value.colors);
  if (effect === botProfileEffects.gradient && colors?.length === 1)
    colors = [colors[0]!, colors[0]!];

  return {
    display_name_font_id: id(value.font, botProfileFonts, "font"),
    display_name_effect_id: effect,
    display_name_colors: colors,
  };
}

function id<T extends Record<string, number>>(
  value: string | number | null | undefined,
  values: T,
  kind: string,
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined || (typeof value === "string" && !value.trim()))
    return undefined;
  const key = String(value).trim().toLowerCase();
  const result = values[key] ?? Number(key);
  if (!Number.isInteger(result))
    throw new UserError(`Unknown profile ${kind} "${value}".`);
  return result;
}

function profileColors(
  value?: BotProfileColor | readonly BotProfileColor[] | null,
): number[] | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const input: readonly BotProfileColor[] =
    typeof value === "string" || typeof value === "number" ? [value] : value;
  const values: BotProfileColor[] = [];
  for (const item of input) {
    if (typeof item === "string")
      values.push(...item.split(/[,\s]+/).filter(Boolean));
    else values.push(item);
  }
  return values.map((color) => {
    if (
      typeof color === "number" &&
      Number.isInteger(color) &&
      color >= 0 &&
      color <= 0xffffff
    )
      return color;
    const hex = String(color).trim().replace(/^#/, "");
    if (!/^[\da-f]{6}$/i.test(hex))
      throw new UserError(`Invalid profile color "${color}".`);
    return parseInt(hex, 16);
  });
}

function discordMessage(error: unknown): string {
  const raw =
    typeof error === "object" && error && "rawError" in error
      ? JSON.stringify(error.rawError)
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Discord rejected that bot profile update.";
  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}
