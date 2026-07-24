import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateFilters } from "../../../services/settings/filters.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "antiinvite toggle",
  description: "Toggle Discord invite filtering for this server.",
  syntax: "antiinvite toggle",
  example: "antiinvite toggle",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const settings = await updateFilters(ctx.guild!.id, (value) => ({
      ...value,
      antiinvite: { ...value.antiinvite, enabled: !value.antiinvite.enabled },
    }));
    return ctx.reply(
      embeds.success(
        `Anti-invite is now **${settings.antiinvite.enabled ? "enabled" : "disabled"}**.`,
      ),
    );
  },
});
