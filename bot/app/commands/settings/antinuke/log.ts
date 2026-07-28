import { cmd } from "../../../../../index.ts";
import { requireSecurityAccess } from "../../../../features/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke log",
  aliases: ["an log"],
  description: "Set the AntiNuke log channel.",
  syntax: "antinuke log <channel>",
  example: "antinuke log #channel",
  type: "message",
  context: "guild",
  args: { channel: { type: "channel", required: true } },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const channel = ctx.channel("channel")!;
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: { ...value.antinuke, logChannelId: channel.id },
    }));
    return ctx.reply(
      embeds.success(`AntiNuke logs will be sent to ${channel}.`),
    );
  },
});
