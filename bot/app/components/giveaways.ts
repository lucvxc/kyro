import { eq } from "drizzle-orm";
import { cmp, UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { giveaways } from "../../db/schema.ts";
import { giveawayCard } from "../../features/giveaways/index.ts";

export default cmp({
  id: /^giveaway:[a-z0-9]{10}$/,
  context: "guild",
  run: async (ctx) => {
    const id = ctx.params[0]!;
    const [item] = await db
      .select()
      .from(giveaways)
      .where(eq(giveaways.id, id))
      .limit(1);
    if (!item || item.endedAt || item.endsAt <= new Date())
      throw new UserError("That giveaway has ended.");
    const entered = item.entries.includes(ctx.user.id);
    const entries = entered
      ? item.entries.filter((id) => id !== ctx.user.id)
      : [...item.entries, ctx.user.id];
    await db.update(giveaways).set({ entries }).where(eq(giveaways.id, id));
    await ctx.update(await giveawayCard({ ...item, entries }, ctx.guild!));
  },
});
