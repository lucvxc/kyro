import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../index.ts";
import embeds from "../../utils/config/embeds.ts";
import { warn } from "../../services/moderation/warnings.ts";

export default cmd({
  name: "warn", description: "Warn a member and apply configured punishments.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ModerateMembers], syntax: "warn <user> (reason)", example: "warn @user Spamming",
  args: { user: { type: "user", required: true }, reason: { type: "string" } },
  run: async ctx => {
    const user = ctx.user("user")!;
    const reason = ctx.string("reason") ?? "No reason provided";
    await ctx.mod.check(user, "warn", PermissionFlagsBits.ModerateMembers);
    const result = await warn(ctx.guild!.id, user.id, ctx.author.id, reason);
    const audit = `Reached ${result.count} warnings: ${reason}`;

    if (result.punishment?.action === "timeout") await ctx.mod.timeout(user, result.punishment.duration ?? 3_600_000, { reason: audit });
    if (result.punishment?.action === "kick") await ctx.mod.kick(user, { reason: audit });
    if (result.punishment?.action === "ban") await ctx.mod.ban(user, { reason: audit });

    const punished = result.punishment?.action === "timeout" ? "timed out" : result.punishment?.action === "kick" ? "kicked" : "banned";
    const action = result.punishment ? ` They were **${punished}**.` : "";
    return ctx.reply(embeds.success(`Warned **${user.tag}**. They now have **${result.count}** warning${result.count === 1 ? "" : "s"}.${action}`));
  },
});
