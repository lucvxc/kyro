import {
  ButtonStyles,
  MessageComponentTypes,
  TextStyles,
  type DiscordEmoji,
  type InteractionCallbackData,
  type MessageComponent,
} from "discordeno";

export type Control = Record<string, unknown> & { type: number };
export type ButtonKind =
  "primary" | "secondary" | "success" | "danger" | "link";
export interface ButtonOptions {
  id?: string;
  label?: string;
  style?: ButtonKind;
  url?: string;
  emoji?: Partial<DiscordEmoji>;
  disabled?: boolean;
}
export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: Partial<DiscordEmoji>;
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
export interface ModalSelectOptions extends Omit<SelectOptions, "disabled"> {
  type: "string";
  label: string;
  description?: string;
  required?: boolean;
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

export function input(options: InputOptions): Control {
  text(options.id, "Text input id", 100);
  text(options.label, "Text input label", 45);
  optionalText(options.description, "Text input description", 100);
  return compact({
    type: MessageComponentTypes.InputText,
    customId: options.id,
    label: options.label,
    style:
      options.style === "paragraph" ? TextStyles.Paragraph : TextStyles.Short,
    placeholder: options.placeholder,
    value: options.value,
    minLength: options.min,
    maxLength: options.max,
    required: options.required ?? true,
  });
}
export function modal(options: ModalOptions): InteractionCallbackData {
  text(options.id, "Modal id", 100);
  text(options.title, "Modal title", 45);
  if ((options.inputs?.length ?? 0) > 5)
    throw new TypeError("Modals can have at most 5 inputs.");

  const ids = new Set<string>();
  for (const field of options.inputs ?? []) {
    if (field.type === "display") {
      text(field.content, "Modal display text", 4_000);
      continue;
    }

    text(field.id, "Modal field id", 100);
    text(field.label, "Modal field label", 45);
    optionalText(field.description, "Modal field description", 100);
    if (ids.has(field.id))
      throw new TypeError(`Modal field id "${field.id}" is duplicated.`);
    ids.add(field.id);
  }

  return {
    customId: options.id,
    title: options.title,
    components: (options.inputs ?? []).map((field) =>
      field.type === "display"
        ? { type: 10, content: field.content }
        : {
            type: 18,
            label: field.label,
            description: field.description,
            component: modalComponent(field),
          },
    ) as unknown as MessageComponent[],
  } as InteractionCallbackData;
}
function modalComponent(field: Exclude<ModalInput, ModalTextOptions>): Control {
  if (!field.type || field.type === "text") return input(field);
  if (field.type === "string") return select(field);
  if (
    field.type === "user" ||
    field.type === "role" ||
    field.type === "mentionable" ||
    field.type === "channel"
  ) {
    const types = { user: 5, role: 6, mentionable: 7, channel: 8 } as const;
    return compact({
      type: types[field.type as keyof typeof types],
      customId: field.id,
      placeholder: field.placeholder,
      minValues: field.min,
      maxValues: field.max,
      required: field.required,
    });
  }
  const types = { file: 19, radio: 21, checkbox: 22, checkboxes: 23 } as const;
  return compact({
    type: types[field.type],
    customId: field.id,
    minValues: "min" in field ? field.min : undefined,
    maxValues: "max" in field ? field.max : undefined,
    required: "required" in field ? field.required : undefined,
    default: "default" in field ? field.default : undefined,
    options: "options" in field ? field.options : undefined,
  });
}
export function button(options: ButtonOptions): Control {
  const style = options.style ?? (options.url ? "link" : "primary");
  const hasEmoji = Boolean(options.emoji?.id || options.emoji?.name?.trim());
  const hasLabel = Boolean(options.label?.trim());
  if (!hasLabel && !hasEmoji)
    throw new TypeError("Buttons require a non-empty label or emoji.");
  optionalText(options.label, "Button label", 80);
  if (style === "link" && !options.url)
    throw new TypeError("Link buttons require a url.");
  if (style !== "link" && !options.id)
    throw new TypeError("Interactive buttons require an id.");
  if (options.id) text(options.id, "Button id", 100);
  if (options.url && options.url.length > 512)
    throw new TypeError("Button url cannot exceed 512 characters.");
  return compact({
    type: MessageComponentTypes.Button,
    style: {
      primary: ButtonStyles.Primary,
      secondary: ButtonStyles.Secondary,
      success: ButtonStyles.Success,
      danger: ButtonStyles.Danger,
      link: ButtonStyles.Link,
    }[style],
    customId: style === "link" ? undefined : options.id,
    url: options.url,
    label: options.label,
    emoji: options.emoji,
    disabled: options.disabled,
  });
}
export function select(options: SelectOptions | ModalSelectOptions): Control {
  text(options.id, "Select id", 100);
  optionalText(options.placeholder, "Select placeholder", 150);
  if (!options.options.length || options.options.length > 25)
    throw new TypeError("Select menus require 1 to 25 options.");
  const values = new Set<string>();
  for (const option of options.options) {
    text(option.label, "Select option label", 100);
    text(option.value, "Select option value", 100);
    optionalText(option.description, "Select option description", 100);
    if (values.has(option.value))
      throw new TypeError(
        `Select option value "${option.value}" is duplicated.`,
      );
    values.add(option.value);
  }
  const min = options.min ?? 1;
  const max = options.max ?? 1;
  if (min < 0 || max < 1 || min > max || max > options.options.length)
    throw new TypeError("Select menu min/max values are invalid.");
  return compact({
    type: MessageComponentTypes.SelectMenu,
    customId: options.id,
    placeholder: options.placeholder,
    minValues: options.min,
    maxValues: options.max,
    disabled: "disabled" in options ? options.disabled : undefined,
    required: "required" in options ? options.required : undefined,
    options: options.options.map((option) =>
      compact({
        label: option.label,
        value: option.value,
        description: option.description,
        emoji: option.emoji,
        default: option.default,
      }),
    ),
  });
}
export function thumb(url: string, spoiler = false): Control {
  return { type: 11, media: { url }, spoiler };
}
export function row(...components: Control[]): Control {
  if (!components.length || components.length > 5)
    throw new TypeError("Action rows require 1 to 5 components.");
  const buttons = components.every(
    (component) => component.type === MessageComponentTypes.Button,
  );
  if (!buttons && components.length !== 1)
    throw new TypeError(
      "Action rows can contain up to 5 buttons or one select menu.",
    );
  return { type: MessageComponentTypes.ActionRow, components };
}

function text(value: string, name: string, max: number): void {
  if (!value.trim()) throw new TypeError(`${name} cannot be empty.`);
  if (value.length > max)
    throw new TypeError(`${name} cannot exceed ${max} characters.`);
}

function optionalText(
  value: string | undefined,
  name: string,
  max: number,
): void {
  if (value !== undefined) text(value, name, max);
}
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}
