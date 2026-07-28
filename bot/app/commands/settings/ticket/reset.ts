import { PermissionFlagsBits } from "discord.js";
import { and, eq } from "drizzle-orm";
import { cmd, UserError } from "../../../../../index.ts";
import { db } from "../../../../db/database.ts";
import { tickets } from "../../../../db/schema.ts";
import { editTicketSettings } from "../../../../features/settings/tickets.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket reset",
  aliases: ["tickets reset"],
  description: "Reset ticket configuration when no tickets are open.",
  syntax: "ticket reset",
  example: "ticket reset",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const [open] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(
        and(eq(tickets.guildId, ctx.guild!.id), eq(tickets.status, "open")),
      )
      .limit(1);
    if (open)
      throw new UserError(
        "Close all open tickets before resetting the configuration.",
      );
    await editTicketSettings(ctx.guild!.id, () => ({}));
    return ctx.reply(
      embeds.success(
        "Ticket configuration reset. Existing channels were left untouched.",
      ),
    );
  },
});
