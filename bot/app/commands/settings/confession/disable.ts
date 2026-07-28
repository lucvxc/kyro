import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../../index.ts";
import { updateConfessions } from "../../../../features/settings/confessions.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "confession disable",
  aliases: ["conf disable"],
  description: "Disable anonymous confessions.",
  syntax: "confession disable",
  example: "confession disable",
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
