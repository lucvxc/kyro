import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerEmbeds } from "../../utils/config/logger.ts";

export default evt({
  name: "guildBanRemove",
  run: async ban => {
    await sendLog(ban.guild, "memberUnban", loggerEmbeds.memberUnban(ban));
  },
});
