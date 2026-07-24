import { evt } from "../../index.ts";
import { updateHoneypotPanel } from "../services/settings/honeypot.ts";
import { securitySettings } from "../services/settings/security.ts";

export default evt({
  name: "messageCreate",
  run: async (message) => {
    if (!message.guild || message.author.bot) return;
    const config = (await securitySettings(message.guild.id)).honeypot;
    if (!config.enabled || message.channelId !== config.channelId) return;
    if (
      message.author.id === message.guild.ownerId ||
      !message.member?.kickable
    )
      return;
    await message.member.kick("Honeypot triggered");
    await message.delete().catch(() => undefined);
    const catches = (config.catches ?? 0) + 1;
    if (config.panelMessageId && config.channelId) {
      await updateHoneypotPanel(
        message.guild,
        config.channelId,
        config.panelMessageId,
        catches,
        config.accent ?? "#5865F2",
      );
    }
  },
});
