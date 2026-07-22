import { AuditLogEvent } from "discord.js";
import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { auditActor } from "../../utils/audit.ts";
import { loggerCards } from "../../utils/config/logger.ts";

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
