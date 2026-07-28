import { PermissionFlagsBits } from "discord.js";
import { cmd, container, time } from "../../../../index.ts";
import { listWarnings } from "../../../features/moderation/warnings.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "warnings",
  aliases: ["warns"],
  description: "Show a member's warnings.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  syntax: "warnings <user>",
  example: "warnings @user",
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    const user = ctx.user("user")!;
    const warnings = await listWarnings(ctx.guild!.id, user.id);
    const list = warnings
      .slice(0, 15)
      .map(
        (warning) =>
          `**#${warning.id}** · ${warning.reason}\n-# By <@${warning.moderatorId}> · ${time(warning.createdAt, "R")}`,
      )
      .join("\n\n");
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Warnings for ${user.tag}\n-# ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`,
        )
        .separator()
        .text(list || "This member has no warnings."),
    );
  },
});
