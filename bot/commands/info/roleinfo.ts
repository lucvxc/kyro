import { cmd, container, thumb, time } from "../../../index.ts";
import { colors } from "../../utils/config/constants.ts";

export default cmd({
  name: "roleinfo",
  description: "Show information about a role.",
  type: "message",
  aliases: ["ri"],
  syntax: "roleinfo (@role)",
  example: "roleinfo @Moderator",
  context: "guild",
  args: {
    role: { type: "role", description: "The role to look up" },
  },
  run: async (ctx) => {
    const role = ctx.roleStats("role");
    const icon = role.icon();

    const card = container()
      .accent(icon ? await role.accent() : colors.default)
      .section(
        `## ${role.name}\n${role.mention}`,
        icon ? thumb(icon) : undefined,
      )
      .separator()
      .text(
        `**${role.members.toLocaleString()}** Members · **${role.permissions}** Permissions · Position **${role.position}**`,
      )
      .text(
        `**Color** ${role.color}\n**Mentionable** ${role.mentionable ? "Yes" : "No"}\n**Hoisted** ${role.hoisted ? "Yes" : "No"}\n**Managed** ${role.managed ? "Yes" : "No"}\n**Created** ${time(role.created)}`,
      )
      .text(`-# ID ${role.id}`);

    return ctx.reply(card);
  },
});
