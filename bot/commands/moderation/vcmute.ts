import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "vcmute", description: "Server mute a voice member.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.MuteMembers], syntax: "vcmute <user> (reason)", example: "vcmute @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.voiceMute(user, true, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Voice muted **${user.tag}**.`));
  },
});
