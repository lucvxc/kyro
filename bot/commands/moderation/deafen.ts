import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "deafen",
  aliases: ["vcdeafen"],
  description: "Server deafen a voice member.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.DeafenMembers],
  syntax: "deafen <user> (reason)",
  example: "deafen @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    await ctx.mod.deafen(user, true, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(embeds.success(`Deafened **${user.tag}**.`));
  },
});
