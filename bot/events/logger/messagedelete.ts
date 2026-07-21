import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerEmbeds } from "../../utils/config/logger.ts";

export default evt({
  name: "messageDelete",
  run: async message => {
    if (!message.guild || message.author?.bot) return;
    await sendLog(message.guild, "messageDelete", loggerEmbeds.messageDelete(message), message.channelId);
  },
});
