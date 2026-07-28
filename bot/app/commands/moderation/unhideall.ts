import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "unhideall",
  description: "Restore visibility for every server channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "unhideall (reason)",
  example: "unhideall",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const count = await ctx.server.channels.showAll(
      ctx.string("reason") ?? undefined,
    );
    return ctx.reply(embeds.success(`Restored **${count}** channels.`));
  },
});
