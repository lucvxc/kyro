import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "voiceStateUpdate",
  run: async (before, after) => {
    if (before.channelId === after.channelId) return;
    if (!before.channelId && after.channelId) {
      await sendLog(
        after.guild,
        "voiceJoin",
        loggerCards.voice(after, "joined", undefined, after.channelId),
      );
    } else if (before.channelId && !after.channelId) {
      await sendLog(
        after.guild,
        "voiceLeave",
        loggerCards.voice(after, "left", before.channelId),
      );
    } else {
      await sendLog(
        after.guild,
        "voiceMove",
        loggerCards.voice(after, "moved", before.channelId!, after.channelId!),
      );
    }
  },
});
