import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "starboard disable",
  description: "Disable the starboard.",
  syntax: "starboard disable",
  example: "starboard disable",
  type: "message",
  context: "guild",
  permissions,
  run: async (ctx) => {
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: {},
    }));
    return ctx.reply(embeds.success("Starboard disabled."));
  },
});
