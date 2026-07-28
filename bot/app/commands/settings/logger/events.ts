import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import {
  logEvents,
  loggerSettings,
} from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "logger events",
  aliases: ["log events"],
  description: "Show enabled logging events.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger events",
  example: "logger events",
  run: async (ctx) => {
    const config = await loggerSettings(ctx.guild!.id);
    const enabled = config.events?.length ? config.events : logEvents;
    return ctx.reply(
      embeds.info(
        logEvents
          .map((event) => `${enabled.includes(event) ? "✓" : "×"} \`${event}\``)
          .join("\n"),
      ),
    );
  },
});
