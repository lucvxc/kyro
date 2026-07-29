import type { DiscordEmbed } from "discordeno";
import { color, type Color } from "./Color.ts";

export interface Author {
  name: string;
  icon?: string;
  url?: string;
}
export interface Footer {
  text: string;
  icon?: string;
}
export interface Field {
  name: string;
  value: string;
  inline?: boolean;
}
export interface EmbedOptions {
  title?: string;
  description?: string;
  color?: Color;
  url?: string;
  author?: string | Author;
  footer?: string | Footer;
  thumbnail?: string;
  image?: string;
  fields?: readonly Field[];
  timestamp?: boolean | Date | number;
}

export class Embed {
  public readonly kind = "embed";
  readonly #data: DiscordEmbed;
  public constructor(data: DiscordEmbed = {}) {
    this.#data = structuredClone(data);
  }
  public get empty(): boolean {
    return Object.keys(this.#data).length === 0;
  }
  public set(options: EmbedOptions): this {
    if (options.title) this.title(options.title);
    if (options.description) this.desc(options.description);
    if (options.color !== undefined) this.color(options.color);
    if (options.url) this.url(options.url);
    if (options.author) this.author(options.author);
    if (options.footer) this.footer(options.footer);
    if (options.thumbnail) this.thumb(options.thumbnail);
    if (options.image) this.image(options.image);
    if (options.fields?.length) this.fields(...options.fields);
    if (options.timestamp)
      this.time(options.timestamp === true ? Date.now() : options.timestamp);
    return this;
  }
  public title(value: string): this {
    this.#data.title = value;
    return this;
  }
  public desc(value: string): this {
    this.#data.description = value;
    return this;
  }
  public color(value: Color): this {
    this.#data.color = color(value);
    return this;
  }
  public url(value: string): this {
    this.#data.url = value;
    return this;
  }
  public author(value: string | Author): this {
    const item = typeof value === "string" ? { name: value } : value;
    this.#data.author = { name: item.name, icon_url: item.icon, url: item.url };
    return this;
  }
  public footer(value: string | Footer): this {
    const item = typeof value === "string" ? { text: value } : value;
    this.#data.footer = { text: item.text, icon_url: item.icon };
    return this;
  }
  public image(value: string): this {
    this.#data.image = { url: value };
    return this;
  }
  public thumb(value: string): this {
    this.#data.thumbnail = { url: value };
    return this;
  }
  public time(value: Date | number = Date.now()): this {
    this.#data.timestamp = new Date(value).toISOString();
    return this;
  }
  public field(name: string, value: string, inline = false): this {
    (this.#data.fields ??= []).push({ name, value, inline });
    return this;
  }
  public fields(...values: Field[]): this {
    (this.#data.fields ??= []).push(...values);
    return this;
  }
  public clear(): this {
    this.#data.fields = [];
    return this;
  }
  public toJSON(): DiscordEmbed {
    return structuredClone(this.#data);
  }
}

export function embed(options: EmbedOptions = {}): Embed {
  return new Embed().set(options);
}
