import { cmd } from "../../../../../index.ts";
import embeds from "../../../../shared/config/embeds.ts";
import {
  fakePerms,
  label,
  owner,
  permissionChoices,
  permissionName,
} from "../../../../shared/fakepermissions.ts";

export default cmd({
  name: "fakepermissions grant",
  aliases: ["fp grant"],
  description: "Grant a Discord permission to a role through the bot.",
  type: "message",
  context: "guild",
  syntax: "fakepermissions grant <role> <permission>",
  example: "fakepermissions grant @moderator Ban Members",
  args: {
    role: {
      type: "role",
      required: true,
      description: "Role receiving the permission",
    },
    permission: {
      type: "string",
      required: true,
      autocomplete: true,
      description: "Discord permission to grant",
    },
  },
  autocomplete: (ctx) => permissionChoices(ctx.value),
  run: async (ctx) => {
    owner(ctx);
    const role = ctx.role("role")!;
    const permission = permissionName(ctx.string("permission")!);
    const added = await fakePerms.grant(ctx.guild!.id, role.id, permission);

    return ctx.reply(
      added
        ? embeds.success(`Granted **${label(permission)}** to <@&${role.id}>.`)
        : embeds.warning(
            `<@&${role.id}> already has **${label(permission)}**.`,
          ),
    );
  },
});
