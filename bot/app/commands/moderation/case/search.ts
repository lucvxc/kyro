import { PermissionFlagsBits } from "discord.js";
import { cmd, container } from "../../../../../index.ts";
import { searchCases } from "../../../../features/moderation/cases.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "case search",
  description: "Search cases by user or action.",
  syntax: "case search <user or action>",
  example: "case search timeout",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: { query: { type: "string", required: true } },
  run: async (ctx) => {
    const rows = await searchCases(ctx.guild!.id, ctx.string("query")!);
    const body =
      rows
        .map(
          (item) =>
            `**${item.number}** ${item.action} · <@${item.userId}> · <t:${Math.floor(item.createdAt.getTime() / 1000)}:R>`,
        )
        .join("\n") || "No matching cases.";
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Case Search\n-# ${rows.length} results\n${body}`),
    );
  },
});
