import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  DiscordInteractionContextType,
  type DiscordApplicationIntegrationType,
  type CreateApplicationCommand,
  type CreateSlashApplicationCommand,
} from "discordeno";

import type { Args } from "./Arg.ts";
import type { Entry } from "./Cmd.ts";

type CreateApplicationCommandOption = NonNullable<
  CreateSlashApplicationCommand["options"]
>[number];

export function compileSlash(
  commands: readonly Entry[],
): CreateApplicationCommand[] {
  const roots = groupBy(
    commands.filter((command) => command.type !== "message"),
    (command) => command.path[0]!,
  );

  if (roots.size > 100) {
    throw new Error(
      `Discord allows at most 100 slash command roots; this catalog has ${roots.size}. Group related commands under subcommands or mark guild-only commands as message commands.`,
    );
  }

  return [...roots].map(([name, entries]) => compileRoot(name, entries));
}

function compileRoot(
  name: string,
  entries: readonly Entry[],
): CreateApplicationCommand {
  const direct = entries.find((command) => command.path.length === 1);
  const nested = entries.filter((command) => command.path.length > 1);
  if (direct && nested.length) {
    throw new Error(
      `Slash command "${name}" cannot be both a command and a parent of subcommands.`,
    );
  }

  if (direct) {
    return {
      name,
      description: direct.description,
      type: ApplicationCommandTypes.ChatInput,
      options: compileArgs(direct.args),
      contexts: contexts([direct]),
      nameLocalizations: direct.nameLocalizations,
      descriptionLocalizations: direct.descriptionLocalizations,
      integrationTypes: integrationTypes([direct]),
    };
  }

  const options: CreateApplicationCommandOption[] = nested
    .filter((entry) => entry.path.length === 2)
    .map((command) => subcommand(command));
  const groups = groupBy(
    nested.filter((entry) => entry.path.length === 3),
    (command) => command.path[1]!,
  );
  for (const [groupName, commands] of groups) {
    options.push({
      type: ApplicationCommandOptionTypes.SubCommandGroup,
      name: groupName,
      description: `Commands for ${name} ${groupName}.`,
      options: commands.map((command) => subcommand(command)),
    });
  }

  return {
    name,
    description: `Commands for ${name}.`,
    type: ApplicationCommandTypes.ChatInput,
    options,
    contexts: contexts(entries),
    integrationTypes: integrationTypes(entries),
  };
}

function subcommand(command: Entry): CreateApplicationCommandOption {
  return {
    type: ApplicationCommandOptionTypes.SubCommand,
    name: command.path.at(-1)!,
    description: command.description,
    nameLocalizations: command.nameLocalizations,
    descriptionLocalizations: command.descriptionLocalizations,
    options: compileArgs(command.args),
  };
}

function compileArgs(args?: Args): CreateApplicationCommandOption[] {
  return Object.entries(args ?? {}).map(([name, arg]) => ({
    type: optionType(arg.type),
    name,
    description: arg.description ?? `Value for ${name}.`,
    required: Boolean(arg.required),
    autocomplete: arg.autocomplete,
    choices: arg.choices?.map((choice) => ({
      name: choice.name,
      value:
        arg.type === "number" || arg.type === "integer"
          ? Number(choice.value)
          : String(choice.value),
      nameLocalizations: choice.nameLocalizations,
    })),
    nameLocalizations: arg.nameLocalizations,
    descriptionLocalizations: arg.descriptionLocalizations,
    minValue: arg.min,
    maxValue: arg.max,
    minLength: arg.minLength,
    maxLength: arg.maxLength,
    channelTypes: arg.channelTypes,
  })) as CreateApplicationCommandOption[];
}

function optionType(
  type: keyof typeof OPTION_TYPES,
): ApplicationCommandOptionTypes {
  return OPTION_TYPES[type];
}

const OPTION_TYPES = {
  string: ApplicationCommandOptionTypes.String,
  number: ApplicationCommandOptionTypes.Number,
  integer: ApplicationCommandOptionTypes.Integer,
  boolean: ApplicationCommandOptionTypes.Boolean,
  user: ApplicationCommandOptionTypes.User,
  role: ApplicationCommandOptionTypes.Role,
  channel: ApplicationCommandOptionTypes.Channel,
  attachment: ApplicationCommandOptionTypes.Attachment,
} as const;

function contexts(commands: readonly Entry[]): DiscordInteractionContextType[] {
  const result = new Set<DiscordInteractionContextType>();
  for (const command of commands) {
    if (command.context !== "dms")
      result.add(DiscordInteractionContextType.Guild);
    if (command.context !== "guild") {
      result.add(DiscordInteractionContextType.BotDm);
      result.add(DiscordInteractionContextType.PrivateChannel);
    }
  }
  return [...result];
}

function integrationTypes(
  commands: readonly Entry[],
): DiscordApplicationIntegrationType[] | undefined {
  const result = [
    ...new Set(commands.flatMap((command) => command.integrationTypes ?? [])),
  ];
  return result.length ? result : undefined;
}

function groupBy<T, K>(values: Iterable<T>, key: (value: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const value of values) {
    const name = key(value);
    const current = groups.get(name);
    if (current) current.push(value);
    else groups.set(name, [value]);
  }
  return groups;
}
