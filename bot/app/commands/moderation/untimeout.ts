import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "untimeout",
  aliases: ["unmute"],
  description: "Remove a member's timeout.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  syntax: "untimeout <user> (reason)",
  example: "untimeout @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    await ctx.mod.untimeout(user, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(embeds.success(`Removed **${user.tag}**'s timeout.`));
  },
});
