import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "move",
  aliases: ["vcmove"],
  description: "Move a member to another voice channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.MoveMembers],
  syntax: "move <user> <channel> (reason)",
  example: "move @user General",
  args: {
    user: { type: "user", required: true },
    channel: { type: "channel", required: true },
    reason: { type: "string" },
  },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const channel = ctx.channel("channel");
    if (!channel?.isVoiceBased())
      throw new UserError("Choose a voice channel.");
    await ctx.mod.move(user, channel, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(embeds.success(`Moved **${user.tag}** to ${channel}.`));
  },
});
