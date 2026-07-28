import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "vckick",
  aliases: ["voicedisconnect"],
  description: "Disconnect a member from voice.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.MoveMembers],
  syntax: "vckick <user> (reason)",
  example: "vckick @user",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    await ctx.mod.disconnect(user, {
      reason: ctx.string("reason") ?? undefined,
    });
    return ctx.reply(
      embeds.success(`Disconnected **${user.tag}** from voice.`),
    );
  },
});
