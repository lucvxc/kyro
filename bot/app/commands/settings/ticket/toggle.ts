import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import {
  editTicketSettings,
  getTicketSettings,
} from "../../../../features/settings/tickets.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "ticket toggle",
  aliases: ["tickets toggle"],
  description: "Enable or disable new tickets.",
  syntax: "ticket toggle",
  example: "ticket toggle",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const settings = await getTicketSettings(ctx.guild!.id);
    const enabled = !settings.enabled;
    await editTicketSettings(ctx.guild!.id, (value) => ({ ...value, enabled }));
    return ctx.reply(
      embeds.success(`Tickets ${enabled ? "enabled" : "disabled"}.`),
    );
  },
});
