import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { recentInvites } from "../../../../features/invites/stats.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "invites recent",
  aliases: ["inv recent"],
  description: "View recently tracked joins.",
  syntax: "invites recent",
  example: "invites recent",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const rows = await recentInvites(ctx.guild!.id);
    const body =
      rows
        .map(
          (row) =>
            `<@${row.memberId}> via ${row.inviterId ? `<@${row.inviterId}>` : "unknown"} · <t:${Math.floor(row.joinedAt.getTime() / 1000)}:R>${row.leftAt ? " · left" : ""}${row.fake ? " · new account" : ""}`,
        )
        .join("\n") || "No tracked joins yet.";
    return ctx.reply(
      container().accent(colors.default).text(`## Recent Invites\n${body}`),
    );
  },
});
