import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "ban", description: "Ban a member from the server.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.BanMembers], syntax: "ban <user> (reason)", example: "ban @user Spamming",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.ban(user, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Banned **${user.tag}**.`));
  },
});
