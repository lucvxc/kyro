import { evt } from "../../../index.ts";
import { sendLog } from "../../services/settings/logger.ts";
import { loggerEmbeds } from "../../utils/config/logger.ts";

export default evt({
  name: "voiceStateUpdate",
  run: async (before, after) => {
    if (before.channelId === after.channelId) return;
    if (!before.channelId && after.channelId) {
      await sendLog(after.guild, "voiceJoin", loggerEmbeds.voice(after, "joined", undefined, after.channelId));
    } else if (before.channelId && !after.channelId) {
      await sendLog(after.guild, "voiceLeave", loggerEmbeds.voice(after, "left", before.channelId));
    } else {
      await sendLog(after.guild, "voiceMove", loggerEmbeds.voice(after, "moved", before.channelId!, after.channelId!));
    }
  },
});
