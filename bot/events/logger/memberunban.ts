import { AuditLogEvent } from "discord.js";
import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { auditActor } from "../../utils/audit.ts";
import { loggerCards } from "../../utils/config/logger.ts";

export default evt({
  name: "guildBanRemove",
  run: async ban => {
    const actor = await auditActor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    await sendLog(ban.guild, "memberUnban", loggerCards.memberUnban(ban, actor));
  },
});
