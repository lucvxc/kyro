import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "hideall",
  description: "Hide every server channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "hideall (reason)",
  example: "hideall Emergency lockdown",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const count = await ctx.server.channels.hideAll(
      ctx.string("reason") ?? undefined,
    );
    return ctx.reply(embeds.success(`Hidden **${count}** channels.`));
  },
});
