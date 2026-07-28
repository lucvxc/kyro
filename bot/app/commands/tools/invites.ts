import { cmd, embed } from "../../../../index.ts";
import { inviteStats } from "../../../features/invites/stats.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "invites",
  aliases: ["inv"],
  description: "View a member's invite statistics.",
  syntax: "invites (user)",
  example: "invites @user",
  type: "message",
  context: "guild",
  args: { user: { type: "user" } },
  run: async (ctx) => {
    const user = ctx.user("user") ?? ctx.author;
    const stats = await inviteStats(ctx.guild!.id, user.id);
    return ctx.reply(
      embed({
        color: colors.default,
        author: { name: user.tag, icon: user.displayAvatarURL() },
        description: `**Active** ${stats.active}\n**Total** ${stats.total} · **Left** ${stats.left} · **Fake** ${stats.fake}`,
      }),
    );
  },
});
