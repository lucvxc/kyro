import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "unlockall",
  description: "Unlock every text channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "unlockall (reason)",
  example: "unlockall Lockdown ended",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const count = await ctx.server.channels.unlockAll(
      ctx.string("reason") ?? undefined,
    );
    return ctx.reply(embeds.success(`Unlocked **${count}** channels.`));
  },
});
