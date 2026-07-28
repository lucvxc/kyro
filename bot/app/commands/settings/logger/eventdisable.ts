import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  logEvents,
  setLogEvent,
  type LogEvent,
} from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "logger event disable",
  aliases: ["log event disable", "log eventdisable"],
  description: "Disable a logging event.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger event disable <event>",
  example: "logger event disable voiceMove",
  args: {
    event: {
      type: "string",
      required: true,
      description: "Logging event",
      choices: logEvents.map((value) => ({ name: value, value })),
    },
  },
  run: async (ctx) => {
    const event = ctx.string("event") as LogEvent;
    if (!logEvents.includes(event))
      throw new UserError("That logging event does not exist.");
    if (!(await setLogEvent(ctx.guild!.id, event, false)))
      throw new UserError(`The **${event}** event is already disabled.`);
    return ctx.reply(embeds.success(`Disabled **${event}** logging.`));
  },
});
