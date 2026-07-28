import { and, eq } from "drizzle-orm";
import { cmd } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { boosterRoleMembers } from "../../../../db/schema.ts";
import { personalBoosterRole } from "../../../../features/boosterroles/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boosterrole remove",
  aliases: ["booster remove"],
  description: "Delete your personal booster role.",
  syntax: "boosterrole remove",
  example: "boosterrole remove",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const role = await personalBoosterRole(member);
    await role.delete("Booster removed personal role");
    await db
      .delete(boosterRoleMembers)
      .where(
        and(
          eq(boosterRoleMembers.guildId, ctx.guild!.id),
          eq(boosterRoleMembers.userId, ctx.author.id),
        ),
      );
    return ctx.reply(embeds.success("Removed your personal booster role."));
  },
});
