import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { updateConfessions } from "../../../services/settings/confessions.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "confession disable",
  description: "Disable anonymous confessions.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    await updateConfessions(ctx.guild!.id, (value) => ({
      ...value,
      enabled: false,
    }));
    return ctx.reply(embeds.success("Confessions are disabled."));
  },
});
