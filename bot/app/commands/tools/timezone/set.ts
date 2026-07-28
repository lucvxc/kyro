import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { users } from "../../../../db/schema.ts";
import { localTime, timezone } from "../../../../features/timezone/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "timezone set",
  aliases: ["tz set"],
  description: "Set your timezone.",
  syntax: "timezone set <zone>",
  example: "timezone set America/Los_Angeles",
  type: "message",
  context: "both",
  args: { zone: { type: "string", required: true } },
  run: async (ctx) => {
    const zone = timezone(ctx.string("zone")!);
    if (!zone)
      throw new UserError(
        "Timezone not found. Use `timezone list <city>` to search.",
      );
    await db
      .insert(users)
      .values({ id: ctx.author.id, timezone: zone })
      .onConflictDoUpdate({ target: users.id, set: { timezone: zone } });
    return ctx.reply(
      embeds.success(`Timezone set to **${zone}**.\n-# ${localTime(zone)}`),
    );
  },
});
