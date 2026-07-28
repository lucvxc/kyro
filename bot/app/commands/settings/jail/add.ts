import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  jailSettings,
  updateJail,
} from "../../../../features/settings/jail.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "jail add",
  aliases: ["jail"],
  description: "Jail a member.",
  syntax: "jail add <user> (reason)",
  example: "jail add @user Spamming",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers],
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async (ctx) => {
    const config = await jailSettings(ctx.guild!.id);
    if (!config.roleId) throw new UserError("Run `jail setup` first.");
    const user = ctx.user("user")!;
    const member = await ctx.guild!.members.fetch(user.id).catch(() => null);
    if (!member || member.id === ctx.guild!.ownerId || !member.manageable)
      throw new UserError("I cannot jail that member.");
    const role = ctx.guild!.roles.cache.get(config.roleId);
    if (!role)
      throw new UserError(
        "The jail role is missing. Run `jail delete`, then set it up again.",
      );
    const roleIds = member.roles.cache
      .filter(
        (item) =>
          item.id !== ctx.guild!.id && !item.managed && item.id !== role.id,
      )
      .map((item) => item.id);
    const reason = ctx.string("reason") ?? "No reason provided";
    await member.roles.set([role], `Jailed by ${ctx.author.tag}: ${reason}`);
    await updateJail(ctx.guild!.id, (value) => ({
      ...value,
      jailed: {
        ...(value.jailed ?? {}),
        [member.id]: {
          moderatorId: ctx.author.id,
          reason,
          jailedAt: Date.now(),
          roleIds,
        },
      },
    }));
    return ctx.reply(
      embeds.success(`${member} was jailed.\n**Reason** ${reason}`),
    );
  },
});
