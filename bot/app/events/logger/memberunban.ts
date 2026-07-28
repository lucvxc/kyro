import { AuditLogEvent } from "discord.js";
import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { auditActor } from "../../../shared/audit.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "guildBanRemove",
  run: async (ban) => {
    const actor = await auditActor(
      ban.guild,
      AuditLogEvent.MemberBanRemove,
      ban.user.id,
    );
    await sendLog(
      ban.guild,
      "memberUnban",
      loggerCards.memberUnban(ban, actor),
    );
  },
});
