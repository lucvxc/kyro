import { and, eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { reminders } from "../../../db/schema.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "reminder cancel",
  aliases: ["remind cancel"],
  description: "Cancel one of your reminders.",
  syntax: "reminder cancel <id>",
  example: "reminder cancel 12",
  type: "message",
  args: { id: { type: "number", required: true } },
  run: async (ctx) => {
    const rows = await db
      .delete(reminders)
      .where(
        and(
          eq(reminders.id, ctx.number("id")!),
          eq(reminders.userId, ctx.author.id),
        ),
      )
      .returning();
    if (!rows.length) throw new UserError("That reminder does not exist.");
    await ctx.reply(embeds.success("Reminder cancelled."));
  },
});
