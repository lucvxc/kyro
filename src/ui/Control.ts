import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ThumbnailBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type APIMessageComponentEmoji,
} from "discord.js";

export type ButtonKind = "primary" | "secondary" | "success" | "danger" | "link";

export interface ButtonOptions {
  id?: string;
  label?: string;
  style?: ButtonKind;
  url?: string;
  emoji?: APIMessageComponentEmoji;
  disabled?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: APIMessageComponentEmoji;
  default?: boolean;
}

export interface SelectOptions {
  id: string;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  options: readonly SelectOption[];
}

export interface InputOptions {
  id: string; label: string; style?: "short" | "paragraph"; placeholder?: string;
  value?: string; min?: number; max?: number; required?: boolean;
}
export interface ModalOptions { id: string; title: string; inputs?: readonly InputOptions[]; }
export function input(options: InputOptions): TextInputBuilder {
  const value = new TextInputBuilder().setCustomId(options.id).setLabel(options.label)
    .setStyle(options.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short)
    .setRequired(options.required ?? true);
  if (options.placeholder) value.setPlaceholder(options.placeholder);
  if (options.value) value.setValue(options.value);
  if (options.min !== undefined) value.setMinLength(options.min);
  if (options.max !== undefined) value.setMaxLength(options.max);
  return value;
}
export function modal(options: ModalOptions): ModalBuilder {
  const value = new ModalBuilder().setCustomId(options.id).setTitle(options.title);
  for (const field of options.inputs ?? []) value.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input(field)));
  return value;
}

export function button(options: ButtonOptions): ButtonBuilder {
  const builder = new ButtonBuilder();
  const style = options.style ?? (options.url ? "link" : "primary");

  builder.setStyle(ButtonStyle[style[0]!.toUpperCase() + style.slice(1) as keyof typeof ButtonStyle]);

  if (style === "link") {
    if (!options.url) throw new TypeError("Link buttons require a url.");
    if (options.id) throw new TypeError("Link buttons use url instead of id.");
    builder.setURL(options.url);
  } else {
    if (!options.id) throw new TypeError("Interactive buttons require an id.");
    builder.setCustomId(options.id);
  }

  if (options.label) builder.setLabel(options.label);
  if (options.emoji) builder.setEmoji(options.emoji);
  if (options.disabled) builder.setDisabled(true);

  return builder;
}

export function select(options: SelectOptions): StringSelectMenuBuilder {
  const builder = new StringSelectMenuBuilder().setCustomId(options.id);
  builder.addOptions(
    options.options.map((option) => {
      const value = new StringSelectMenuOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value);

      if (option.description) value.setDescription(option.description);
      if (option.emoji) value.setEmoji(option.emoji);
      if (option.default) value.setDefault(true);
      return value;
    }),
  );

  if (options.placeholder) builder.setPlaceholder(options.placeholder);
  if (options.min !== undefined) builder.setMinValues(options.min);
  if (options.max !== undefined) builder.setMaxValues(options.max);
  if (options.disabled) builder.setDisabled(true);
  return builder;
}

export function thumb(url: string, spoiler = false): ThumbnailBuilder {
  return new ThumbnailBuilder({ media: { url }, spoiler });
}

export function row(...components: (ButtonBuilder | StringSelectMenuBuilder)[]): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder> {
  return new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>().addComponents(components);
}
