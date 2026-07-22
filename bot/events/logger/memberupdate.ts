import { AuditLogEvent } from "discord.js";
import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { auditActor } from "../../utils/audit.ts";
import { loggerCards } from "../../utils/config/logger.ts";

export default evt({
  name: "guildMemberUpdate",
  run: async (before, after) => {
    if (
      before.communicationDisabledUntilTimestamp !==
      after.communicationDisabledUntilTimestamp
    ) {
      const removed = !after.communicationDisabledUntilTimestamp;
      const actor = await auditActor(
        after.guild,
        AuditLogEvent.MemberUpdate,
        after.id,
      );
      await sendLog(
        after.guild,
        "memberTimeout",
        loggerCards.timeout(after, removed, actor),
      );
    }

    const added = after.roles.cache
      .filter((role) => !before.roles.cache.has(role.id))
      .map((role) => role.id);
    const removed = before.roles.cache
      .filter((role) => !after.roles.cache.has(role.id))
      .map((role) => role.id);
    if (added.length || removed.length) {
      const actor = await auditActor(
        after.guild,
        AuditLogEvent.MemberRoleUpdate,
        after.id,
      );
      await sendLog(
        after.guild,
        "memberRoles",
        loggerCards.roles(after, added, removed, actor),
      );
    }
  },
});
