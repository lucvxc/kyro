import { PermissionFlagsBits } from "discord.js";
import { eq } from "drizzle-orm";
import { cmd, container } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { boosterRoleMembers } from "../../../../db/schema.ts";
import { colors } from "../../../../shared/config/constants.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boosterrole list",
  aliases: ["booster list"],
  description: "List personal booster roles in this server.",
  syntax: "boosterrole list",
  example: "boosterrole list",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageRoles],
  run: async (ctx) => {
    const rows = await db
      .select()
      .from(boosterRoleMembers)
      .where(eq(boosterRoleMembers.guildId, ctx.guild!.id));
    if (!rows.length)
      return ctx.reply(embeds.warning("No personal booster roles exist."));
    return ctx.reply(
      container()
        .accent(colors.default)
        .text(`## Booster roles\n-# ${rows.length} active`)
        .separator()
        .text(
          rows.map((row) => `<@${row.userId}> <@&${row.roleId}>`).join("\n"),
        ),
    );
  },
});
