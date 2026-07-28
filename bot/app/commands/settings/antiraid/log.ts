import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antiraid log",
  aliases: ["raid log"],
  description: "Set the AntiRaid log channel.",
  syntax: "antiraid log <channel>",
  example: "antiraid log #channel",
  type: "message",
  context: "guild",
  args: { channel: { type: "channel", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const channel = ctx.channel("channel")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antiraid: { ...value.antiraid, logChannelId: channel.id },
    }));
    return ctx.reply(
      embeds.success(`AntiRaid logs will be sent to ${channel}.`),
    );
  },
});
