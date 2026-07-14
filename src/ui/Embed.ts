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

export class Embed {
  public readonly kind = "embed";
  readonly #builder: EmbedBuilder;

  public constructor(data?: APIEmbed) {
    this.#builder = new EmbedBuilder(data);
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

export function embed(data?: APIEmbed): Embed {
  return new Embed(data);
}
