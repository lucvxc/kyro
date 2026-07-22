import { cmd, container } from "../../../index.ts";

export default cmd({
  name: "rolecolor",
  description: "Show a role's color.",
  type: "message",
  aliases: ["rolecolour"],
  syntax: "rolecolor (@role)",
  example: "rolecolor @Moderator",
  context: "guild",
  args: { role: { type: "role", description: "The role to look up" } },
  run: async (ctx) => {
    const role = ctx.roleStats("role");
    return ctx.reply(
      container()
        .accent(await role.accent())
        .text(`## ${role.name}\n-# ${role.mention}`)
        .separator()
        .text(`**Hex** \`${role.color}\`\n**Position** ${role.position}`),
    );
  },
});
