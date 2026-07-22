import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd } from "../../../../index.ts";
import { db } from "../../../db/database.ts";
import { boosterRoleMembers } from "../../../db/schema.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "boosterrole cleanup",
  description: "Remove personal roles whose owners are no longer boosting.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(boosterRoleMembers)
      .where(eq(boosterRoleMembers.guildId, ctx.guild!.id));
    let removed = 0;
    for (const row of rows) {
      const member = await ctx
        .guild!.members.fetch(row.userId)
        .catch(() => null);
      if (member?.premiumSince) continue;
      await ctx
        .guild!.roles.cache.get(row.roleId)
        ?.delete("Booster role cleanup")
        .catch(() => undefined);
      await db
        .delete(boosterRoleMembers)
        .where(eq(boosterRoleMembers.roleId, row.roleId));
      removed++;
    }
    return ctx.reply(
      embeds.success(`Cleaned up **${removed}** booster roles.`),
    );
  },
});
