import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "nuke",
  description: "Recreate the current channel with the same settings.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageChannels],
  syntax: "nuke (reason)",
  example: "nuke Cleaning the channel",
  args: { reason: { type: "string" } },
  run: async (ctx) => {
    const channel = ctx.guild!.channels.cache.get(ctx.input.channelId)!;
    const replacement = await ctx.server.channels.nuke(
      channel,
      ctx.string("reason") ?? undefined,
    );
    return ctx.send(
      replacement,
      embeds.success("This channel was nuked successfully."),
    );
  },
});
