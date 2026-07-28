import { evt } from "../../../../index.ts";
import { sendLog } from "../../../features/settings/logger.ts";
import { loggerCards } from "../../../shared/config/logger.ts";

export default evt({
  name: "inviteCreate",
  run: async (invite) => {
    const guild = invite.guild
      ? invite.client.guilds.cache.get(invite.guild.id)
      : undefined;
    if (guild) await sendLog(guild, "inviteCreate", loggerCards.invite(invite));
  },
});
