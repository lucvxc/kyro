import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerEmbeds } from "../../utils/config/logger.ts";

export default evt({
  name: "guildMemberRemove",
  run: async member => {
    await sendLog(member.guild, "memberLeave", loggerEmbeds.memberLeave(member));
  },
});
