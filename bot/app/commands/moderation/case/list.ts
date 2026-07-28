import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { listCases } from "../../../../features/moderation/cases.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "case list",
  aliases: ["cases"],
  description: "List recent moderation cases.",
  syntax: "case list (user)",
  example: "case list @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: { user: { type: "user" } },
  run: async (ctx) => {
    const rows = await listCases(ctx.guild!.id, ctx.user("user")?.id);
    const text = rows.length
      ? rows
          .map(
            (item) =>
              `**${item.number}** ${item.action} · <@${item.userId}> · <t:${Math.floor(item.createdAt.getTime() / 1000)}:R>`,
          )
          .join("\n")
      : "No moderation cases found.";
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Moderation Cases\n-# ${rows.length} recent cases\n${text}`),
    );
  },
});
