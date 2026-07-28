import {
  InteractionContextType,
  SlashCommandBuilder,
  type APIApplicationCommandOption,
  type SlashCommandSubcommandBuilder,
} from "discord.js";

import type { Arg, Args } from "./Arg.ts";
import type { Entry } from "./Cmd.ts";

type SlashCommandJSON = ReturnType<SlashCommandBuilder["toJSON"]> & {
  name: string;
  options?: APIApplicationCommandOption[];
  contexts?: InteractionContextType[];
};

export function compileSlash(commands: readonly Entry[]): SlashCommandJSON[] {
  const slashCommands = commands.filter(
    (command) => command.type !== "message",
  );
  const roots = groupBy(slashCommands, (command) => command.path[0]!);

  return [...roots.entries()].map(([rootName, entries]) => {
    const directCommand = entries.find((command) => command.path.length === 1);
    const nestedCommands = entries.filter((command) => command.path.length > 1);

    if (directCommand && nestedCommands.length > 0) {
      throw new Error(
        `Slash command "${rootName}" cannot be both a command and a parent of subcommands.`,
      );
    }

    if (directCommand) {
      const command = new SlashCommandBuilder()
        .setName(rootName)
        .setDescription(directCommand.description);

      if (directCommand.nameLocalizations)
        command.setNameLocalizations(directCommand.nameLocalizations);
      if (directCommand.descriptionLocalizations)
        command.setDescriptionLocalizations(
          directCommand.descriptionLocalizations,
        );

      addContexts(command, [directCommand]);
      return addArgs(command, directCommand.args).toJSON() as SlashCommandJSON;
    }

    const builder = new SlashCommandBuilder()
      .setName(rootName)
      .setDescription(`Commands for ${rootName}.`);

    for (const command of nestedCommands.filter(
      (entry) => entry.path.length === 2,
    )) {
      builder.addSubcommand((subcommand) => {
        subcommand
          .setName(command.path[1]!)
          .setDescription(command.description);
        if (command.nameLocalizations)
          subcommand.setNameLocalizations(command.nameLocalizations);
        if (command.descriptionLocalizations)
          subcommand.setDescriptionLocalizations(
            command.descriptionLocalizations,
          );
        return addArgs(subcommand, command.args);
      });
    }

    const groups = groupBy(
      nestedCommands.filter((entry) => entry.path.length === 3),
      (command) => command.path[1]!,
    );

    for (const [groupName, groupCommands] of groups) {
      builder.addSubcommandGroup((group) => {
        group
          .setName(groupName)
          .setDescription(`Commands for ${rootName} ${groupName}.`);

        for (const command of groupCommands) {
          group.addSubcommand((subcommand) => {
            subcommand
              .setName(command.path[2]!)
              .setDescription(command.description);
            if (command.nameLocalizations)
              subcommand.setNameLocalizations(command.nameLocalizations);
            if (command.descriptionLocalizations)
              subcommand.setDescriptionLocalizations(
                command.descriptionLocalizations,
              );
            return addArgs(subcommand, command.args);
          });
        }

        return group;
      });
    }

    addContexts(builder, entries);
    return builder.toJSON() as SlashCommandJSON;
  });
}

function groupBy<T, K>(values: Iterable<T>, key: (value: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const value of values) {
    const name = key(value);
    const items = groups.get(name);
    if (items) items.push(value);
    else groups.set(name, [value]);
  }
  return groups;
}

type Builder = SlashCommandBuilder | SlashCommandSubcommandBuilder;

function addArgs<T extends Builder>(builder: T, args: Args | undefined): T {
  for (const [name, arg] of Object.entries(args ?? {})) {
    const description = arg.description ?? `Value for ${name}.`;
    const setup = <
      O extends {
        setName(name: string): O;
        setDescription(text: string): O;
        setRequired(value: boolean): O;
        setNameLocalizations(values: NonNullable<Arg["nameLocalizations"]>): O;
        setDescriptionLocalizations(
          values: NonNullable<Arg["descriptionLocalizations"]>,
        ): O;
      },
    >(
      option: O,
    ): O => {
      const value = option
        .setName(name)
        .setDescription(description)
        .setRequired(Boolean(arg.required));
      if (arg.nameLocalizations)
        value.setNameLocalizations(arg.nameLocalizations);
      if (arg.descriptionLocalizations)
        value.setDescriptionLocalizations(arg.descriptionLocalizations);
      return value;
    };

    switch (arg.type) {
      case "string":
        builder.addStringOption((option) => {
          setup(option);
          if (arg.autocomplete) option.setAutocomplete(true);
          if (arg.choices)
            option.addChoices(
              ...arg.choices.map((choice) => ({
                name: choice.name,
                value: String(choice.value),
                name_localizations: choice.nameLocalizations,
              })),
            );
          return option;
        });
        break;
      case "number":
        builder.addNumberOption((option) => {
          setup(option);
          if (arg.autocomplete) option.setAutocomplete(true);
          if (arg.choices)
            option.addChoices(
              ...arg.choices.map((choice) => ({
                name: choice.name,
                value: Number(choice.value),
                name_localizations: choice.nameLocalizations,
              })),
            );
          return option;
        });
        break;
      case "boolean":
        builder.addBooleanOption(setup);
        break;
      case "user":
        builder.addUserOption(setup);
        break;
      case "role":
        builder.addRoleOption(setup);
        break;
      case "channel":
        builder.addChannelOption(setup);
        break;
    }
  }

  return builder;
}

function addContexts(
  builder: SlashCommandBuilder,
  commands: readonly Entry[],
): void {
  const contexts = new Set<InteractionContextType>();

  for (const command of commands) {
    if (command.context !== "dms") contexts.add(InteractionContextType.Guild);

    if (command.context !== "guild") {
      contexts.add(InteractionContextType.BotDM);
      contexts.add(InteractionContextType.PrivateChannel);
    }
  }

  builder.setContexts([...contexts]);
}
