import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { renderEmbed } from "../../../../features/settings/embeds.ts";

export default cmd({
  name: "embed",
  aliases: ["emb"],
  description: "Send an embed from embed code.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  syntax: "embed <code>",
  example: "embed $v{embed}$v{description:Hello}",
  args: { code: { type: "string", required: true, description: "Embed code" } },
  run: async (ctx) => {
    const channel = ctx.message!.channel;
    if (!channel.isSendable())
      throw new UserError("I cannot send an embed in this channel.");
    await channel.send({
      ...renderEmbed(ctx.string("code")!, ctx.guild!, ctx.author),
      allowedMentions: { parse: [] },
    });
  },
});
