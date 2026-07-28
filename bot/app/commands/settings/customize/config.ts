import { PermissionFlagsBits } from "discord.js";
import { button, cmd, container } from "../../../../../index.ts";
import { colors } from "../../../../shared/config/constants.ts";

export default cmd({
  name: "customize config",
  aliases: ["custom config"],
  description: "Open the server customization panel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize config",
  example: "customize config",
  run: (ctx) => {
    return ctx.reply(
      container()
        .accent(colors.default)
        .row(
          button({ id: "customize:name", label: "Name", style: "secondary" }),
          button({
            id: "customize:profile",
            label: "Profile",
            style: "secondary",
          }),
        ),
    );
  },
});
