import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  renderEmbed,
  savedEmbed,
} from "../../../../features/settings/embeds.ts";
import { isEmbedFormat } from "../../../../shared/parser.ts";

export default cmd({
  name: "embed send",
  aliases: ["emb send"],
  description: "Send a saved embed or raw embed code.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "embed send <name/code> (channel)",
  example: "embed send rules #rules",
  run: async (ctx) => {
    const input = [...ctx.raw];
    const possibleChannel = input.at(-1)?.match(/^<#(\d+)>$/)?.[1];
    const selected = possibleChannel
      ? ctx.guild!.channels.cache.get(possibleChannel)
      : undefined;
    if (selected) input.pop();
    const channel = selected ?? ctx.message!.channel;
    if (!channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");

    const query = input.join(" ").trim();
    if (!query)
      throw new UserError(
        `Use **${ctx.prefix}embed send <name/code> (channel)**.`,
      );
    const code = isEmbedFormat(query)
      ? query
      : (await savedEmbed(ctx.author.id, query)).code;
    await channel.send({
      ...renderEmbed(code, ctx.guild!, ctx.author),
      allowedMentions: { parse: [] },
    });
  },
});
