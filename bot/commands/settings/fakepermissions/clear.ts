import { cmd } from "../../../../index.ts";
import { fakePerms, owner } from "../../../utils/fakepermissions.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "fakepermissions clear",
  aliases: ["fp clear"],
  description: "Clear fake permissions from a role or the entire server.",
  type: "message",
  context: "guild",
  syntax: "fakepermissions clear (role)",
  example: "fakepermissions clear @moderator",
  args: {
    role: { type: "role", description: "Role to clear; omit to clear every role" },
  },
  run: async ctx => {
    owner(ctx);
    const role = ctx.role("role");
    const removed = await fakePerms.clear(ctx.guild!.id, role?.id);
    if (!removed) return ctx.reply(embeds.info(role
      ? `<@&${role.id}> has no fake permissions.`
      : "This server has no fake permissions configured."));

    return ctx.reply(embeds.success(role
      ? `Cleared **${removed}** fake permission${removed === 1 ? "" : "s"} from <@&${role.id}>.`
      : `Cleared **${removed}** fake permission${removed === 1 ? "" : "s"} from this server.`));
  },
});
