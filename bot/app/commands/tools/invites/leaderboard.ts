import { cmd, container } from "../../../../../index.ts";
import { inviteLeaders } from "../../../../features/invites/stats.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "invites leaderboard",
  aliases: ["invites lb", "inv lb"],
  description: "View the server invite leaderboard.",
  syntax: "invites leaderboard",
  example: "invites leaderboard",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const rows = await inviteLeaders(ctx.guild!.id);
    const body =
      rows
        .map(
          (row, index) =>
            `**${index + 1}.** <@${row.inviterId}> · **${row.active}** active · ${row.total} total`,
        )
        .join("\n") || "No tracked invites yet.";
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Invite Leaderboard\n-# Active and all-time invited members\n${body}`,
        ),
    );
  },
});
