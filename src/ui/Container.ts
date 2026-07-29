import { basename } from "node:path";
import { color, type Color } from "./Color.ts";
import { row, type Control } from "./Control.ts";

export interface GalleryItem {
  url: string;
  description?: string;
  spoiler?: boolean;
}
export type Spacing = "small" | "large";
export class Container {
  public readonly kind = "container";
  public readonly files: { attachment: string; name: string }[] = [];
  readonly #components: Control[] = [];
  #accent?: number;
  public accent(value: Color): this {
    this.#accent = color(value);
    return this;
  }
  public text(content: string): this {
    this.#components.push({ type: 10, content });
    return this;
  }
  public separator(divider = true, spacing: Spacing = "small"): this {
    this.#components.push({
      type: 14,
      divider,
      spacing: spacing === "large" ? 2 : 1,
    });
    return this;
  }
  public section(content: string, accessory?: Control): this {
    if (!accessory) return this.text(content);
    this.#components.push({
      type: 9,
      components: [{ type: 10, content }],
      accessory,
    });
    return this;
  }
  public gallery(...items: (string | GalleryItem)[]): this {
    this.#components.push({
      type: 12,
      items: items.map((item) => {
        const value = typeof item === "string" ? { url: item } : item;
        return {
          media: { url: value.url },
          description: value.description,
          spoiler: value.spoiler,
        };
      }),
    });
    return this;
  }
  public file(path: string, name = basename(path), spoiler = false): this {
    this.files.push({ attachment: path, name });
    this.#components.push({
      type: 13,
      file: { url: `attachment://${name}` },
      spoiler,
    });
    return this;
  }
  public row(...components: Control[]): this {
    this.#components.push(row(...components));
    return this;
  }
  public toJSON(): Control {
    const value = {
      type: 17,
      accentColor: this.#accent,
      components: this.#components,
    };
    validate(value);
    return value;
  }
}
export function container(): Container {
  return new Container();
}

function validate(root: Control): void {
  const ids = new Set<string>();
  let count = 0;
  const visit = (component: Control): void => {
    count += 1;
    if (count > 40)
      throw new TypeError(
        "Component V2 messages can have at most 40 components.",
      );
    if (component.type === 10) {
      const content = component.content;
      if (typeof content !== "string" || !content.trim())
        throw new TypeError("Text display content cannot be empty.");
      if (content.length > 4_000)
        throw new TypeError(
          "Text display content cannot exceed 4000 characters.",
        );
    }
    const id = component.customId;
    if (typeof id === "string") {
      if (ids.has(id))
        throw new TypeError(`Component id "${id}" is duplicated.`);
      ids.add(id);
    }
    const children = component.components;
    if (Array.isArray(children))
      for (const child of children) visit(child as Control);
    const accessory = component.accessory;
    if (accessory && typeof accessory === "object") visit(accessory as Control);
  };
  visit(root);
}
