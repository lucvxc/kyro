import type { Message } from "discord.js";
import { container, embed, thumb, type EmbedOptions, type Entry } from "../../../index.ts";
import { colors, emojis } from "./config.ts";

const make = (color: string, icon: string, text: string, options?: EmbedOptions) =>
  embed({ ...options, color, description: `${icon} ${text}` });

const embeds = {
  success: (text: string, options?: EmbedOptions) => make(colors.success, emojis.embed.success, text, options),
  warning: (text: string, options?: EmbedOptions) => make(colors.warning, emojis.embed.warning, text, options),
  error: (text: string, options?: EmbedOptions) => make(colors.error, emojis.embed.error, text, options),
  loading: (text: string, options?: EmbedOptions) => make(colors.pending, emojis.embed.pending, text, options),
  info: (text: string, options?: EmbedOptions) => make(colors.default, emojis.embed.info, text, options),
  default: (text: string, options?: EmbedOptions) => embed({ ...options, color: colors.default, description: text }),
};

const replys = {
  usage: (text: string, options?: EmbedOptions) => embeds.info(`Usage **${text}**`, options),
  subcommands: (_group: string, commands: readonly Entry[], prefix: string, message: Message) => container()
    .accent(colors.default)
    .section(
      `## ${commands[0]?.path[0] ?? "Command"} Subcommands`,
      thumb(message.client.user!.displayAvatarURL({ size: 256, extension: "png" })),
    )
    .separator()
    .text(commands.map(command => `**${prefix}${command.syntax}**\n-# ${command.description}`).join("\n\n")),
};

export default { ...embeds, ...replys };
