import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { reminders } from "../../../db/schema.ts";
import { parseDelay } from "../../../features/reminders/index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "remind",
  aliases: ["reminder add", "remindme"],
  description: "Create a reminder.",
  syntax: "remind <time> <message>",
  example: "remind 2h Check the oven",
  type: "message",
  args: {
    time: { type: "string", required: true },
    message: { type: "string", required: true },
  },
  run: async (ctx) => {
    const delay = parseDelay(ctx.string("time")!);
    if (!delay)
      throw new UserError(
        "Use a time from 5 seconds to 1 year, such as `30m`, `2h`, or `7d`.",
      );
    const [item] = await db
      .insert(reminders)
      .values({
        userId: ctx.author.id,
        guildId: ctx.guild?.id,
        channelId: ctx.input.channelId,
        content: ctx.string("message")!.slice(0, 1_000),
        dueAt: new Date(Date.now() + delay),
      })
      .returning();
    await ctx.reply(
      embeds.success(
        `Reminder **#${item!.id}** set for <t:${Math.floor(item!.dueAt.getTime() / 1_000)}:R>.`,
      ),
    );
  },
});
