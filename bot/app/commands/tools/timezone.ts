import { eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { users } from "../../../db/schema.ts";
import { localTime } from "../../../features/timezone/index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "timezone",
  aliases: ["tz", "time"],
  description: "View a user's local time.",
  syntax: "timezone (user)",
  example: "timezone @user",
  type: "message",
  context: "both",
  args: { user: { type: "user" } },
  run: async (ctx) => {
    const user = ctx.user("user") ?? ctx.author;
    const [row] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row?.timezone)
      throw new UserError(
        user.id === ctx.author.id
          ? "Set your timezone with `timezone set <zone>`."
          : "That user has not set a timezone.",
      );
    return ctx.reply(
      embeds.default(
        `**${user.tag}** · ${localTime(row.timezone)}\n-# ${row.timezone}`,
      ),
    );
  },
});
