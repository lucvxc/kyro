import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antilink toggle",
  description: "Toggle link filtering for this server.",
  syntax: "antilink toggle",
  example: "antilink toggle",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const settings = await updateFilters(ctx.guild!.id, (value) => ({
      ...value,
      antilink: { ...value.antilink, enabled: !value.antilink.enabled },
    }));
    return ctx.reply(
      embeds.success(
        `Anti-link is now **${settings.antilink.enabled ? "enabled" : "disabled"}**.`,
      ),
    );
  },
});
