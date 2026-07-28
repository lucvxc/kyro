import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "messageUpdate",
  run: async (before, after) => {
    if (!after.guild || after.author?.bot || before.content === after.content)
      return;
    await sendLog(
      after.guild,
      "messageEdit",
      loggerCards.messageEdit(before, after),
      after.channelId,
    );
  },
});
