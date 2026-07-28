export type ArgType =
  "string" | "number" | "boolean" | "user" | "role" | "channel";

export interface Arg {
  type: ArgType;
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
  choices?: readonly { name: string; value: string | number }[];
  autocomplete?: boolean;
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
    if (arg.autocomplete && arg.type !== "string" && arg.type !== "number") {
      throw new TypeError(
        `Argument "${name}" autocomplete is only supported for strings and numbers.`,
      );
    }
    if (arg.choices && arg.type !== "string" && arg.type !== "number") {
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
        (arg.type === "number" && typeof arg.default === "number") ||
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

    if (!arg.required) optional = true;
    else if (optional) {
      throw new TypeError(
        "Required arguments must be declared before optional arguments.",
      );
    }
  }
}
