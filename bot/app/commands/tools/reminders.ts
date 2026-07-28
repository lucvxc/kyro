import { cmd, container } from "../../../../index.ts";
import { eq } from "drizzle-orm";
import { db } from "../../../db/database.ts";
import { reminders } from "../../../db/schema.ts";

export default cmd({
  name: "reminder list",
  aliases: ["reminders", "remind list"],
  description: "List your reminders.",
  syntax: "reminder list",
  example: "reminders",
  type: "message",
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, ctx.author.id));
    await ctx.reply(
      container()
        .accent(0x5865f2)
        .text(`## Your reminders\n-# ${rows.length} active`)
        .separator()
        .text(
          rows
            .map(
              (item) =>
                `**#${item.id}** <t:${Math.floor(item.dueAt.getTime() / 1_000)}:R>  ·  ${item.content}`,
            )
            .join("\n") || "No active reminders.",
        ),
    );
  },
});
