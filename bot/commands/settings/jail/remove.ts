import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { jailSettings, updateJail } from "../../../services/settings/jail.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "jail remove",
  aliases: ["unjail"],
  description: "Release a jailed member and restore their roles.",
  syntax: "jail remove <user>",
  example: "jail remove @user",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: { user: { type: "user", required: true } },
  run: async (ctx) => {
    const config = await jailSettings(ctx.guild!.id);
    const user = ctx.user("user")!;
    const entry = config.jailed?.[user.id];
    if (!entry) throw new UserError("That member is not jailed.");
    const member = await ctx.guild!.members.fetch(user.id).catch(() => null);
    if (!member) throw new UserError("That member is no longer in the server.");
    const roles = entry.roleIds.filter(
      (id) => ctx.guild!.roles.cache.get(id)?.editable,
    );
    await member.roles.set(roles, `Released by ${ctx.author.tag}`);
    await updateJail(ctx.guild!.id, (value) => {
      const jailed = { ...(value.jailed ?? {}) };
      delete jailed[user.id];
      return { ...value, jailed };
    });
    return ctx.reply(embeds.success(`${member} was released from jail.`));
  },
});
