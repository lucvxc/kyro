import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerEmbeds } from "../../utils/config/logger.ts";

export default evt({
  name: "guildMemberUpdate",
  run: async (before, after) => {
    if (before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp) {
      const removed = !after.communicationDisabledUntilTimestamp;
      await sendLog(after.guild, "memberTimeout", loggerEmbeds.timeout(after, removed));
    }

    const added = after.roles.cache.filter(role => !before.roles.cache.has(role.id)).map(role => role.id);
    const removed = before.roles.cache.filter(role => !after.roles.cache.has(role.id)).map(role => role.id);
    if (added.length || removed.length) {
      await sendLog(after.guild, "memberRoles", loggerEmbeds.roles(after, added, removed));
    }
  },
});
