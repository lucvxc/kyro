import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { resetInvites } from "../../../../features/invites/stats.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "invites reset",
  aliases: ["inv reset"],
  description: "Reset invite history for a member or the server.",
  syntax: "invites reset (user)",
  example: "invites reset @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: { user: { type: "user" } },
  run: async (ctx) => {
    const user = ctx.user("user");
    await resetInvites(ctx.guild!.id, user?.id);
    return ctx.reply(
      embeds.success(
        user
          ? `Reset invite history for **${user.tag}**.`
          : "Reset all server invite history.",
      ),
    );
  },
});
