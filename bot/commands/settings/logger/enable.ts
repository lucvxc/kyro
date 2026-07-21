import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { loggerSettings, setLoggerEnabled } from "../../../services/settings/logger.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "logger enable", description: "Enable server logging.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild], syntax: "logger enable", example: "logger enable",
  run: async ctx => {
    if (!(await loggerSettings(ctx.guild!.id)).channelId) throw new UserError(`Run **${ctx.prefix}logger setup** first.`);
    await setLoggerEnabled(ctx.guild!.id, true);
    return ctx.reply(embeds.success("Enabled server logging."));
  },
});
