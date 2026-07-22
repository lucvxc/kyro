import { AuditLogEvent } from "discord.js";
import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { auditActor } from "../../utils/audit.ts";
import { loggerCards } from "../../utils/config/logger.ts";

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
