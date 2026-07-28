import type { Message } from "discord.js";
import {
  container,
  embed,
  thumb,
  type EmbedOptions,
  type Entry,
} from "../../../index.ts";
import { colors, emojis } from "./constants.ts";

const statusEmbed = (
  color: string,
  icon: string,
  text: string,
  options?: EmbedOptions,
) => embed({ ...options, color, description: `${icon} ${text}` });

const embeds = {
  success: (text: string, options?: EmbedOptions) =>
    statusEmbed(colors.success, emojis.embed.success, text, options),
  warning: (text: string, options?: EmbedOptions) =>
    statusEmbed(colors.warning, emojis.embed.warning, text, options),
  error: (text: string, options?: EmbedOptions) =>
    statusEmbed(colors.error, emojis.embed.error, text, options),
  loading: (text: string, options?: EmbedOptions) =>
    statusEmbed(colors.pending, emojis.embed.pending, text, options),
  info: (text: string, options?: EmbedOptions) =>
    statusEmbed(colors.default, emojis.embed.info, text, options),
  default: (text: string, options?: EmbedOptions) =>
    embed({ ...options, color: colors.default, description: text }),
};

const replies = {
  usage: (text: string, options?: EmbedOptions) =>
    embeds.info(`Usage **${text}**`, options),
  subcommands: (
    _group: string,
    commands: readonly Entry[],
    prefix: string,
    message: Message,
  ) => {
    const root = commands[0]?.path[0] ?? "command";
    const names = commands.map((command) => `\`${command.name}\``).join(", ");

    return container()
      .accent(colors.default)
      .section(
        `## ${root} commands\n-# Use \`${prefix}help <command>\` to view usage and examples.`,
        thumb(
          message.client.user!.displayAvatarURL({
            size: 256,
            extension: "png",
          }),
        ),
      )
      .separator()
      .text(names);
  },
};

export default { ...embeds, ...replies };
