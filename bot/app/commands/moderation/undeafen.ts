import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "undeafen",
  aliases: ["vcundeafen"],
  description: "Remove a member's server deafen.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.DeafenMembers],
  syntax: "undeafen <user> (reason)",
  example: "undeafen @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    await ctx.mod.deafen(user, false, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(embeds.success(`Undeafened **${user.tag}**.`));
  },
});
