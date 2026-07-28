import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { updateCommunity } from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "counting disable",
  aliases: ["count disable"],
  description: "Disable counting without deleting its channel.",
  syntax: "counting disable",
  example: "counting disable",
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
