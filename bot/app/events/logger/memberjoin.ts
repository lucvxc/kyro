import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "guildMemberAdd",
  run: async (member) => {
    await sendLog(member.guild, "memberJoin", loggerCards.memberJoin(member));
  },
});
