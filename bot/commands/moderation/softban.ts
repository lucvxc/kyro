import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "softban", description: "Ban and immediately unban a member.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.BanMembers], syntax: "softban <user> (reason)", example: "softban @user Cleaning messages",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.softban(user, { reason: ctx.string("reason") ?? undefined, deleteDays: 1 });
    return ctx.reply(embeds.success(`Softbanned **${user.tag}**.`));
  },
});
