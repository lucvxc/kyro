import { PermissionFlagsBits } from "discord.js";
import { cmd, container, UserError } from "../../../../../index.ts";
import { getCase } from "../../../../features/moderation/cases.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "case",
  aliases: ["case view", "modcase"],
  description: "View a moderation case.",
  syntax: "case <number>",
  example: "case 12",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: { number: { type: "number", required: true } },
  run: async (ctx) => {
    const item = await getCase(ctx.guild!.id, ctx.number("number")!);
    if (!item) throw new UserError("Case not found.");
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(
          `## Case ${item.number}\n-# <t:${Math.floor(item.createdAt.getTime() / 1000)}:f>\n**Action** ${item.action}\n**User** <@${item.userId}>\n**Moderator** <@${item.moderatorId}>\n**Reason** ${item.reason}${item.duration ? `\n**Duration** ${item.duration}` : ""}`,
        ),
    );
  },
});
