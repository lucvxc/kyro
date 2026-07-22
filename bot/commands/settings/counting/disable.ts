import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "counting disable",
  description: "Disable counting without deleting its channel.",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      counting: { highScore: value.counting.highScore ?? 0 },
    }));
    return ctx.reply(embeds.success("Counting disabled."));
  },
});
