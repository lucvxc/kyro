import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  CheckboxBuilder,
  CheckboxGroupBuilder,
  CheckboxGroupOptionBuilder,
  FileUploadBuilder,
  LabelBuilder,
  MentionableSelectMenuBuilder,
  RadioGroupBuilder,
  RadioGroupOptionBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  type APIMessageComponentEmoji,
} from "discord.js";

export type ButtonKind =
  "primary" | "secondary" | "success" | "danger" | "link";

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
  type?: "text";
  id: string;
  label: string;
  description?: string;
  style?: "short" | "paragraph";
  placeholder?: string;
  value?: string;
  min?: number;
  max?: number;
  required?: boolean;
}
export interface ModalSelectOptions {
  type: "string";
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  options: readonly SelectOption[];
}
export interface ModalAutoSelectOptions {
  type: "user" | "role" | "mentionable" | "channel";
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
}
export interface FileUploadOptions {
  type: "file";
  id: string;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  required?: boolean;
}
export interface RadioOptions {
  type: "radio";
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  options: readonly SelectOption[];
}
export interface CheckboxOptions {
  type: "checkbox";
  id: string;
  label: string;
  description?: string;
  default?: boolean;
}
export interface CheckboxGroupOptions {
  type: "checkboxes";
  id: string;
  label: string;
  description?: string;
  min?: number;
  max?: number;
  required?: boolean;
  options: readonly SelectOption[];
}
export interface ModalTextOptions {
  type: "display";
  content: string;
}
export type ModalInput =
  | InputOptions
  | ModalSelectOptions
  | ModalAutoSelectOptions
  | FileUploadOptions
  | RadioOptions
  | CheckboxOptions
  | CheckboxGroupOptions
  | ModalTextOptions;
export interface ModalOptions {
  id: string;
  title: string;
  inputs?: readonly ModalInput[];
}
export function input(options: InputOptions): TextInputBuilder {
  const value = new TextInputBuilder()
    .setCustomId(options.id)
    .setLabel(options.label)
    .setStyle(
      options.style === "paragraph"
        ? TextInputStyle.Paragraph
        : TextInputStyle.Short,
    )
    .setRequired(options.required ?? true);
  if (options.placeholder) value.setPlaceholder(options.placeholder);
  if (options.value) value.setValue(options.value);
  if (options.min !== undefined) value.setMinLength(options.min);
  if (options.max !== undefined) value.setMaxLength(options.max);
  return value;
}
export function modal(options: ModalOptions): ModalBuilder {
  const value = new ModalBuilder()
    .setCustomId(options.id)
    .setTitle(options.title);
  for (const field of options.inputs ?? []) {
    if (field.type === "display")
      value.addComponents(new TextDisplayBuilder().setContent(field.content));
    else value.addComponents(modalLabel(field));
  }
  return value;
}

function modalLabel(
  options: Exclude<ModalInput, ModalTextOptions>,
): LabelBuilder {
  const value = new LabelBuilder().setLabel(options.label);
  if (options.description) value.setDescription(options.description);

  switch (options.type) {
    case "string":
      return value.setStringSelectMenuComponent(stringSelect(options, true));
    case "user":
      return value.setUserSelectMenuComponent(
        autoSelect(new UserSelectMenuBuilder(), options),
      );
    case "role":
      return value.setRoleSelectMenuComponent(
        autoSelect(new RoleSelectMenuBuilder(), options),
      );
    case "mentionable":
      return value.setMentionableSelectMenuComponent(
        autoSelect(new MentionableSelectMenuBuilder(), options),
      );
    case "channel":
      return value.setChannelSelectMenuComponent(
        autoSelect(new ChannelSelectMenuBuilder(), options),
      );
    case "file":
      return value.setFileUploadComponent(fileUpload(options));
    case "radio":
      return value.setRadioGroupComponent(radio(options));
    case "checkbox":
      return value.setCheckboxComponent(
        new CheckboxBuilder()
          .setCustomId(options.id)
          .setDefault(options.default ?? false),
      );
    case "checkboxes":
      return value.setCheckboxGroupComponent(checkboxes(options));
    default:
      return value.setTextInputComponent(modalInput(options));
  }
}

function modalInput(options: InputOptions): TextInputBuilder {
  const value = new TextInputBuilder()
    .setCustomId(options.id)
    .setStyle(
      options.style === "paragraph"
        ? TextInputStyle.Paragraph
        : TextInputStyle.Short,
    )
    .setRequired(options.required ?? true);
  if (options.placeholder) value.setPlaceholder(options.placeholder);
  if (options.value) value.setValue(options.value);
  if (options.min !== undefined) value.setMinLength(options.min);
  if (options.max !== undefined) value.setMaxLength(options.max);
  return value;
}

export function button(options: ButtonOptions): ButtonBuilder {
  const builder = new ButtonBuilder();
  const style = options.style ?? (options.url ? "link" : "primary");

  builder.setStyle(
    ButtonStyle[
      (style[0]!.toUpperCase() + style.slice(1)) as keyof typeof ButtonStyle
    ],
  );

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
  return stringSelect(options);
}

function stringSelect(
  options: ModalSelectOptions | SelectOptions,
  insideModal = false,
): StringSelectMenuBuilder {
  const builder = new StringSelectMenuBuilder().setCustomId(options.id);
  builder.addOptions(options.options.map(selectOption));

  if (options.placeholder) builder.setPlaceholder(options.placeholder);
  if (options.min !== undefined) builder.setMinValues(options.min);
  if (options.max !== undefined) builder.setMaxValues(options.max);
  if ("required" in options && options.required !== undefined)
    builder.setRequired(options.required);
  if ("disabled" in options && options.disabled && !insideModal)
    builder.setDisabled(true);
  return builder;
}

function autoSelect<
  T extends
    | UserSelectMenuBuilder
    | RoleSelectMenuBuilder
    | MentionableSelectMenuBuilder
    | ChannelSelectMenuBuilder,
>(builder: T, options: ModalAutoSelectOptions): T {
  builder.setCustomId(options.id);
  if (options.placeholder) builder.setPlaceholder(options.placeholder);
  if (options.min !== undefined) builder.setMinValues(options.min);
  if (options.max !== undefined) builder.setMaxValues(options.max);
  if (options.required !== undefined) builder.setRequired(options.required);
  return builder;
}

function fileUpload(options: FileUploadOptions): FileUploadBuilder {
  const builder = new FileUploadBuilder().setCustomId(options.id);
  if (options.min !== undefined) builder.setMinValues(options.min);
  if (options.max !== undefined) builder.setMaxValues(options.max);
  if (options.required !== undefined) builder.setRequired(options.required);
  return builder;
}

function radio(options: RadioOptions): RadioGroupBuilder {
  const builder = new RadioGroupBuilder().setCustomId(options.id).addOptions(
    options.options.map((option) =>
      new RadioGroupOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value)
        .setDefault(option.default ?? false),
    ),
  );
  if (options.required !== undefined) builder.setRequired(options.required);
  return builder;
}

function checkboxes(options: CheckboxGroupOptions): CheckboxGroupBuilder {
  const builder = new CheckboxGroupBuilder().setCustomId(options.id).addOptions(
    options.options.map((option) =>
      new CheckboxGroupOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value)
        .setDefault(option.default ?? false),
    ),
  );
  if (options.min !== undefined) builder.setMinValues(options.min);
  if (options.max !== undefined) builder.setMaxValues(options.max);
  if (options.required !== undefined) builder.setRequired(options.required);
  return builder;
}

function selectOption(option: SelectOption): StringSelectMenuOptionBuilder {
  const value = new StringSelectMenuOptionBuilder()
    .setLabel(option.label)
    .setValue(option.value);

  if (option.description) value.setDescription(option.description);
  if (option.emoji) value.setEmoji(option.emoji);
  if (option.default) value.setDefault(true);
  return value;
}

export function thumb(url: string, spoiler = false): ThumbnailBuilder {
  return new ThumbnailBuilder({ media: { url }, spoiler });
}

export function row(
  ...components: (ButtonBuilder | StringSelectMenuBuilder)[]
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder> {
  return new ActionRowBuilder<
    ButtonBuilder | StringSelectMenuBuilder
  >().addComponents(components);
}
