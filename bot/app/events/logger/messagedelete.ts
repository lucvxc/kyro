import { AuditLogEvent } from "discord.js";
import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { auditActor } from "../../../shared/audit.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "messageDelete",
  run: async (message) => {
    if (!message.guild || message.author?.bot) return;
    const actor = message.author
      ? await auditActor(
          message.guild,
          AuditLogEvent.MessageDelete,
          message.author.id,
        )
      : undefined;
    await sendLog(
      message.guild,
      "messageDelete",
      loggerCards.messageDelete(message, actor),
      message.channelId,
    );
  },
});
