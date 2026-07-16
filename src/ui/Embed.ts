import { EmbedBuilder, type APIEmbed } from "discord.js";

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
  readonly #builder: EmbedBuilder;

  public constructor(data?: APIEmbed) {
    this.#builder = new EmbedBuilder(data);
  }

  public get empty(): boolean { return Object.keys(this.#builder.toJSON()).length === 0; }

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
    if (options.timestamp) this.time(options.timestamp === true ? Date.now() : options.timestamp);
    return this;
  }

  public title(value: string): this {
    this.#builder.setTitle(value);
    return this;
  }

  public desc(value: string): this {
    this.#builder.setDescription(value);
    return this;
  }

  public color(value: Color): this {
    this.#builder.setColor(color(value));
    return this;
  }

  public url(value: string): this {
    this.#builder.setURL(value);
    return this;
  }

  public author(value: string | Author): this {
    const author = typeof value === "string" ? { name: value } : value;
    this.#builder.setAuthor({
      name: author.name,
      iconURL: author.icon,
      url: author.url,
    });
    return this;
  }

  public footer(value: string | Footer): this {
    const footer = typeof value === "string" ? { text: value } : value;
    this.#builder.setFooter({ text: footer.text, iconURL: footer.icon });
    return this;
  }

  public image(value: string): this {
    this.#builder.setImage(value);
    return this;
  }

  public thumb(value: string): this {
    this.#builder.setThumbnail(value);
    return this;
  }

  public time(value: Date | number = Date.now()): this {
    this.#builder.setTimestamp(value);
    return this;
  }

  public field(name: string, value: string, inline = false): this {
    this.#builder.addFields({ name, value, inline });
    return this;
  }

  public fields(...values: Field[]): this {
    this.#builder.addFields(values);
    return this;
  }

  public clear(): this {
    this.#builder.setFields([]);
    return this;
  }

  public toJSON(): APIEmbed {
    return this.#builder.toJSON();
  }
}

export function embed(options: EmbedOptions = {}): Embed {
  return new Embed().set(options);
}
