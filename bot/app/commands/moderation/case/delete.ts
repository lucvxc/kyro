import { PermissionFlagsBits } from "discord.js";
import { and, eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { cases } from "../../../../db/schema.ts";
import { getCase, sendCaseLog } from "../../../../features/moderation/cases.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "case delete",
  description: "Delete a moderation case.",
  syntax: "case delete <number>",
  example: "case delete 12",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.Administrator],
  args: { number: { type: "number", required: true } },
  run: async (ctx) => {
    const number = ctx.number("number")!;
    const item = await getCase(ctx.guild!.id, number);
    if (!item) throw new UserError("Case not found.");
    await sendCaseLog(ctx.guild!, item, `Deleted by <@${ctx.author.id}>`);
    await db
      .delete(cases)
      .where(and(eq(cases.guildId, ctx.guild!.id), eq(cases.number, number)));
    return ctx.reply(embeds.success(`Deleted case **${number}**.`));
  },
});
