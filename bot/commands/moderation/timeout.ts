import { PermissionFlagsBits } from "discord.js";
import { cmd, duration } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "timeout",
  aliases: ["mute"],
  description: "Temporarily timeout a member.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  syntax: "timeout <user> <duration> (reason)",
  example: "timeout @user 30m Spamming",
  args: {
    user: { type: "user", required: true },
    duration: { type: "string", required: true },
    reason: { type: "string" },
  },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const time = ctx.string("duration")!;
    await ctx.mod.timeout(user, duration(time), {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(
      embeds.success(`Timed out **${user.tag}** for **${time}**.`),
    );
  },
});
