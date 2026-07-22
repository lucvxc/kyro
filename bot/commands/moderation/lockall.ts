import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "lockall",
  description: "Lock every text channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "lockall (reason)",
  example: "lockall Server lockdown",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const count = await ctx.server.channels.lockAll(
      ctx.string("reason") ?? undefined,
    );
    return ctx.reply(embeds.success(`Locked **${count}** channels.`));
  },
});
