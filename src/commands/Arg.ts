export type ArgType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "user"
  | "role"
  | "channel"
  | "attachment";

export interface Arg {
  type: ArgType;
  description?: string;
  nameLocalizations?: LocalizationMap;
  descriptionLocalizations?: LocalizationMap;
  required?: boolean;
  default?: string | number | boolean;
  choices?: readonly {
    name: string;
    value: string | number;
    nameLocalizations?: LocalizationMap;
  }[];
  autocomplete?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  channelTypes?: readonly number[];
}

export type Args = Record<string, Arg>;

export function checkArgs(args: Args | undefined): void {
  if (!args) return;

  const entries = Object.entries(args);
  if (entries.length > 25) {
    throw new TypeError("Commands can have at most 25 arguments.");
  }

  let optional = false;

  for (const [name, arg] of entries) {
    if (!/^[a-z0-9_-]{1,32}$/.test(name)) {
      throw new TypeError(
        `Argument "${name}" must use 1-32 lowercase letters, numbers, hyphens, or underscores.`,
      );
    }

    const description = arg.description?.trim();
    checkNames(arg.nameLocalizations, `Argument "${name}"`);
    checkDescriptions(arg.descriptionLocalizations, `Argument "${name}"`);
    if (
      arg.description !== undefined &&
      (!description || description.length > 100)
    ) {
      throw new TypeError(
        `Argument "${name}" description must contain 1-100 characters.`,
      );
    }
    if (arg.autocomplete && arg.choices?.length) {
      throw new TypeError(
        `Argument "${name}" cannot use both autocomplete and choices.`,
      );
    }
    if (
      arg.autocomplete &&
      !["string", "number", "integer"].includes(arg.type)
    ) {
      throw new TypeError(
        `Argument "${name}" autocomplete is only supported for strings and numbers.`,
      );
    }
    if (arg.choices && !["string", "number", "integer"].includes(arg.type)) {
      throw new TypeError(
        `Argument "${name}" choices are only supported for strings and numbers.`,
      );
    }
    if (arg.choices && (arg.choices.length === 0 || arg.choices.length > 25)) {
      throw new TypeError(
        `Argument "${name}" must have between 1 and 25 choices.`,
      );
    }
    for (const choice of arg.choices ?? []) {
      checkChoiceNames(
        choice.nameLocalizations,
        `Argument "${name}" choice "${choice.name}"`,
      );
      if (!choice.name.trim() || choice.name.length > 100)
        throw new TypeError(
          `Argument "${name}" choice names must contain 1-100 characters.`,
        );
      if (
        typeof choice.value === "string" &&
        (choice.value.length === 0 || choice.value.length > 100)
      ) {
        throw new TypeError(
          `Argument "${name}" string choice values must contain 1-100 characters.`,
        );
      }
    }
    if (arg.default !== undefined) {
      const valid =
        (arg.type === "string" && typeof arg.default === "string") ||
        ((arg.type === "number" || arg.type === "integer") &&
          typeof arg.default === "number") ||
        (arg.type === "boolean" && typeof arg.default === "boolean");
      if (!valid)
        throw new TypeError(
          `Argument "${name}" has a default value with the wrong type.`,
        );
      if (arg.required)
        throw new TypeError(
          `Argument "${name}" cannot be required and have a default value.`,
        );
    }
    if (
      arg.type === "integer" &&
      typeof arg.default === "number" &&
      !Number.isInteger(arg.default)
    )
      throw new TypeError(
        `Argument "${name}" integer default must be an integer.`,
      );
    if (
      (arg.minLength !== undefined || arg.maxLength !== undefined) &&
      arg.type !== "string"
    )
      throw new TypeError(
        `Argument "${name}" length constraints require a string.`,
      );
    if (arg.channelTypes && arg.type !== "channel")
      throw new TypeError(
        `Argument "${name}" channel types require a channel.`,
      );
    if (arg.min !== undefined && arg.max !== undefined && arg.min > arg.max)
      throw new TypeError(
        `Argument "${name}" minimum cannot exceed its maximum.`,
      );
    if (
      arg.minLength !== undefined &&
      arg.maxLength !== undefined &&
      arg.minLength > arg.maxLength
    )
      throw new TypeError(
        `Argument "${name}" minimum length cannot exceed its maximum length.`,
      );

    if (!arg.required) optional = true;
    else if (optional) {
      throw new TypeError(
        "Required arguments must be declared before optional arguments.",
      );
    }
  }
}

function checkNames(values: LocalizationMap | undefined, label: string): void {
  for (const value of Object.values(values ?? {}))
    if (value !== null && !/^[\p{Ll}\p{Lm}\p{Lo}\p{N}_-]{1,32}$/u.test(value))
      throw new TypeError(`${label} localized names are invalid.`);
}

function checkChoiceNames(
  values: LocalizationMap | undefined,
  label: string,
): void {
  for (const value of Object.values(values ?? {}))
    if (value !== null && (!value.trim() || value.length > 100))
      throw new TypeError(
        `${label} localized names must contain 1-100 characters.`,
      );
}

function checkDescriptions(
  values: LocalizationMap | undefined,
  label: string,
): void {
  for (const value of Object.values(values ?? {}))
    if (value !== null && (!value.trim() || value.length > 100))
      throw new TypeError(
        `${label} localized descriptions must contain 1-100 characters.`,
      );
}
import type { Localization } from "discordeno";

type LocalizationMap = Localization;
