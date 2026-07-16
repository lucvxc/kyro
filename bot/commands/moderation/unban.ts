import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "unban", description: "Remove a user's server ban.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.BanMembers], syntax: "unban <user> (reason)", example: "unban 295998232989925376 Appeal accepted",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    await ctx.mod.unban(user, { reason: ctx.string("reason") ?? undefined });
    return ctx.reply(embeds.success(`Unbanned **${user.tag}**.`));
  },
});
