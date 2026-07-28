import { AuditLogEvent } from "discord.js";
import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { auditActor } from "../../../shared/audit.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "guildMemberRemove",
  run: async (member) => {
    const actor = await auditActor(
      member.guild,
      AuditLogEvent.MemberKick,
      member.id,
    );
    await sendLog(
      member.guild,
      "memberLeave",
      loggerCards.memberLeave(member, actor),
    );
  },
});
