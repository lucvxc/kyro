import { cmd } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { users } from "../../../db/schema.ts";
import { markAfk } from "../../../features/afk/index.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "afk",
  description: "Set your AFK status.",
  syntax: "afk (reason)",
  example: "afk Eating",
  type: "message",
  context: "guild",
  args: { reason: { type: "string", default: "AFK" } },
  run: async (ctx) => {
    const status = {
      afkReason: ctx.string("reason")!.slice(0, 300),
      afkSince: new Date(),
    };
    await db
      .insert(users)
      .values({ id: ctx.author.id, ...status })
      .onConflictDoUpdate({ target: users.id, set: status });
    markAfk(ctx.author.id);
    await ctx.reply(embeds.success(`You're now AFK: **${status.afkReason}**`));
  },
});
