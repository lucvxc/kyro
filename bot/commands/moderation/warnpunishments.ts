import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import { punishments } from "../../services/moderation/warnings.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "warn punishments",
  description: "List configured warning threshold punishments.",
  syntax: "warn punishments",
  example: "warn punishments",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const values = await punishments(ctx.guild!.id);
    const list = values
      .map(
        (value) =>
          `**${value.warnings} warnings** · ${value.action}${value.duration ? ` for ${value.duration / 60_000} minutes` : ""}`,
      )
      .join("\n");
    return ctx.reply(
      values.length
        ? embeds.default(list, { title: "Warning Punishments" })
        : embeds.info("This server has no warning punishments configured."),
    );
  },
});
