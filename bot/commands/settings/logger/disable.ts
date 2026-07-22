import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { setLoggerEnabled } from "../../../services/settings/logger.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "logger disable",
  description: "Disable server logging.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger disable",
  example: "logger disable",
  run: async (ctx) => {
    await setLoggerEnabled(ctx.guild!.id, false);
    return ctx.reply(embeds.success("Disabled server logging."));
  },
});
