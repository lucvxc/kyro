import { AuditLogEvent } from "discord.js";
import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { auditActor } from "../../utils/audit.ts";
import { loggerCards } from "../../utils/config/logger.ts";

export default evt({
  name: "guildMemberRemove",
  run: async member => {
    const actor = await auditActor(member.guild, AuditLogEvent.MemberKick, member.id);
    await sendLog(member.guild, "memberLeave", loggerCards.memberLeave(member, actor));
  },
});
