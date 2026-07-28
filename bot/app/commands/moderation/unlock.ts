import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "unlock",
  description: "Unlock the current channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "unlock (reason)",
  example: "unlock Cleanup finished",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    await ctx.server.channels.unlock(
      channel,
      ctx.string("reason") ?? undefined,
    );
    return ctx.reply(embeds.success(`Unlocked ${channel}.`));
  },
});
