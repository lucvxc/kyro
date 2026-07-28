import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  FileBuilder,
  MediaGalleryBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  type ThumbnailBuilder,
  type StringSelectMenuBuilder,
} from "discord.js";
import { basename } from "node:path";

import { color, type Color } from "./Color.ts";

export interface GalleryItem {
  url: string;
  description?: string;
  spoiler?: boolean;
}

export type Spacing = "small" | "large";

export class Container {
  public readonly kind = "container";
  public readonly files: { attachment: string; name: string }[] = [];
  readonly #builder = new ContainerBuilder();

  public accent(value: Color): this {
    this.#builder.setAccentColor(color(value));
    return this;
  }

  public text(content: string): this {
    this.#builder.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content),
    );
    return this;
  }

  public separator(divider = true, spacing: Spacing = "small"): this {
    const value =
      spacing === "large"
        ? SeparatorSpacingSize.Large
        : SeparatorSpacingSize.Small;
    this.#builder.addSeparatorComponents(
      new SeparatorBuilder().setDivider(divider).setSpacing(value),
    );
    return this;
  }

  public section(
    content: string,
    accessory?: ButtonBuilder | ThumbnailBuilder,
  ): this {
    if (!accessory) return this.text(content);

    const section = new SectionBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content),
    );
    if (accessory instanceof ButtonBuilder)
      section.setButtonAccessory(accessory);
    else section.setThumbnailAccessory(accessory);
    this.#builder.addSectionComponents(section);
    return this;
  }

  public gallery(...items: (string | GalleryItem)[]): this {
    const gallery = new MediaGalleryBuilder().addItems(
      items.map((item) => {
        const value = typeof item === "string" ? { url: item } : item;
        return {
          media: { url: value.url },
          description: value.description,
          spoiler: value.spoiler,
        };
      }),
    );
    this.#builder.addMediaGalleryComponents(gallery);
    return this;
  }

  public file(path: string, name = basename(path), spoiler = false): this {
    this.files.push({ attachment: path, name });
    this.#builder.addFileComponents(
      new FileBuilder().setURL(`attachment://${name}`).setSpoiler(spoiler),
    );
    return this;
  }

  public row(...components: (ButtonBuilder | StringSelectMenuBuilder)[]): this {
    const row = new ActionRowBuilder<
      ButtonBuilder | StringSelectMenuBuilder
    >().addComponents(components);
    this.#builder.addActionRowComponents(row);
    return this;
  }

  public toJSON() {
    return this.#builder.toJSON();
  }
}

export function container(): Container {
  return new Container();
}
