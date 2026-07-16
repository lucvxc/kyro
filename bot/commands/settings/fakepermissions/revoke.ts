import { cmd } from "../../../../index.ts";
import { fakePerms, label, owner, permissionChoices, permissionName } from "../../../utils/fakepermissions.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "fakepermissions revoke",
  aliases: ["fp revoke"],
  description: "Revoke a fake permission from a role.",
  type: "message",
  context: "guild",
  syntax: "fakepermissions revoke <role> <permission>",
  example: "fakepermissions revoke @moderator Ban Members",
  args: {
    role: { type: "role", required: true, description: "Role losing the permission" },
    permission: { type: "string", required: true, autocomplete: true, description: "Discord permission to revoke" },
  },
  autocomplete: ctx => permissionChoices(ctx.value),
  run: async ctx => {
    owner(ctx);
    const role = ctx.role("role")!;
    const permission = permissionName(ctx.string("permission")!);
    const removed = await fakePerms.revoke(ctx.guild!.id, role.id, permission);

    return ctx.reply(removed
      ? embeds.success(`Revoked **${label(permission)}** from <@&${role.id}>.`)
      : embeds.warning(`<@&${role.id}> does not have **${label(permission)}**.`));
  },
});
