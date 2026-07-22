import { cmd, codes, groups, mention } from "../../../../index.ts";
import embeds from "../../../utils/config/embeds.ts";
import {
  fakePerms,
  label,
  owner,
  permissions,
} from "../../../utils/fakepermissions.ts";

export default cmd({
  name: "fakepermissions list",
  aliases: ["fp list"],
  description: "List available and assigned fake permissions.",
  type: "message",
  context: "guild",
  syntax: "fakepermissions list (role)",
  example: "fakepermissions list @moderator",
  args: {
    role: { type: "role", description: "Only show assignments for this role" },
  },
  run: async (ctx) => {
    owner(ctx);
    const role = ctx.role("role");
    const grants = await fakePerms.list(ctx.guild!.id, role?.id);
    const available = codes(permissions, label);
    const assigned =
      groups(
        grants,
        (grant) => grant.roleId,
        (roleID, values) =>
          `${mention.role(roleID)}\n${codes(values, (value) => label(value.permission))}`,
      ) ||
      (role
        ? `<@&${role.id}> has no fake permissions.`
        : "No fake permissions have been assigned yet.");

    return ctx.reply(
      embeds.default(
        `### Available\n${available}\n\n### Assigned\n${assigned}`,
        {
          title: role ? `Fake Permissions · ${role.name}` : "Fake Permissions",
          footer: {
            text: `${permissions.length} available · ${grants.length} assigned`,
          },
        },
      ),
    );
  },
});
