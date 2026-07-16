import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "vcunmute", description: "Remove a member's server voice mute.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.MuteMembers], syntax: "vcunmute <user> (reason)", example: "vcunmute @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.voiceMute(user, false, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Voice unmuted **${user.tag}**.`));
  },
});
