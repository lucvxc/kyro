import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "kick", aliases: ["boot"], description: "Kick a member from the server.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.KickMembers], syntax: "kick <user> (reason)", example: "kick @user Breaking the rules",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.kick(user, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Kicked **${user.tag}**.`));
  },
});
