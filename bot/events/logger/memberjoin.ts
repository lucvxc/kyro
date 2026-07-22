import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerCards } from "../../utils/config/logger.ts";

export default evt({
  name: "guildMemberAdd",
  run: async (member) => {
    await sendLog(member.guild, "memberJoin", loggerCards.memberJoin(member));
  },
});
