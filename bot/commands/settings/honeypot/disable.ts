import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "honeypot disable",
  aliases: ["hp disable"],
  description: "Disable Honeypot and remove its channel.",
  syntax: "honeypot disable",
  example: "honeypot disable",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).honeypot;
    if (!current.channelId) throw new UserError("Honeypot is not set up.");
    await ctx
      .guild!.channels.cache.get(current.channelId)
      ?.delete(`Honeypot disabled by ${ctx.author.tag}`)
      .catch(() => undefined);
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      honeypot: {},
    }));
    return ctx.reply(embeds.success("Honeypot disabled."));
  },
});
