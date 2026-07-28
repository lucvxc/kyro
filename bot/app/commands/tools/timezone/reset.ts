import { eq } from "drizzle-orm";
import { cmd } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { users } from "../../../../db/schema.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "timezone reset",
  aliases: ["tz reset"],
  description: "Remove your saved timezone.",
  syntax: "timezone reset",
  example: "timezone reset",
  type: "message",
  context: "both",
  run: async (ctx) => {
    await db
      .update(users)
      .set({ timezone: null })
      .where(eq(users.id, ctx.author.id));
    return ctx.reply(embeds.success("Timezone reset."));
  },
});
