import { PermissionFlagsBits } from "discord.js";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cmd, container } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { giveaways } from "../../../../db/schema.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "giveaway list",
  aliases: ["giveaways", "gw list", "gaw list"],
  description: "List active giveaways.",
  syntax: "giveaway list",
  example: "giveaway list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageEvents],
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(giveaways)
      .where(
        and(eq(giveaways.guildId, ctx.guild!.id), isNull(giveaways.endedAt)),
      )
      .orderBy(desc(giveaways.endsAt))
      .limit(15);
    const body = rows.length
      ? rows
          .map(
            (item) =>
              `**${item.id}** ${item.prize} · ${item.entries.length} entries · <t:${Math.floor(item.endsAt.getTime() / 1000)}:R>`,
          )
          .join("\n")
      : "No active giveaways.";
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Active Giveaways\n-# ${rows.length} running\n${body}`),
    );
  },
});
