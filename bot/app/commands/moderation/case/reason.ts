import { PermissionFlagsBits } from "discord.js";
import { and, eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { cases } from "../../../../db/schema.ts";
import { getCase } from "../../../../features/moderation/cases.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "case reason",
  description: "Update a moderation case reason.",
  syntax: "case reason <number> <reason>",
  example: "case reason 12 Repeated spam",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: {
    number: { type: "number", required: true },
    reason: { type: "string", required: true },
  },
  run: async (ctx) => {
    const number = ctx.number("number")!;
    if (!(await getCase(ctx.guild!.id, number)))
      throw new UserError("Case not found.");
    await db
      .update(cases)
      .set({
        reason: ctx.string("reason")!.slice(0, 1000),
        updatedAt: new Date(),
      })
      .where(and(eq(cases.guildId, ctx.guild!.id), eq(cases.number, number)));
    return ctx.reply(embeds.success(`Updated case **${number}**.`));
  },
});
