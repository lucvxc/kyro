import { AuditLogEvent } from "discord.js";
import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { auditActor } from "../../../shared/audit.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "guildBanAdd",
  run: async (ban) => {
    const actor = await auditActor(
      ban.guild,
      AuditLogEvent.MemberBanAdd,
      ban.user.id,
    );
    await sendLog(ban.guild, "memberBan", loggerCards.memberBan(ban, actor));
  },
});
