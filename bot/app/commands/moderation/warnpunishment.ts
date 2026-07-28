import { PermissionFlagsBits } from "discord.js";
import { cmd, duration, UserError } from "../../../../index.ts";
import { setPunishment } from "../../../features/moderation/warnings.ts";
import embeds from "../../../shared/config/embeds.ts";

export default cmd({
  name: "warn punishment",
  aliases: ["warnpunishment"],
  description: "Set or remove a warning threshold punishment.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "warnpunishment <warnings> (action) (duration)",
  example: "warnpunishment 3 timeout 1h",
  args: {
    warnings: { type: "number", required: true },
    action: {
      type: "string",
      choices: ["timeout", "kick", "ban"].map((value) => ({
        name: value,
        value,
      })),
    },
    duration: { type: "string" },
  },
  run: async (ctx) => {
    const warnings = ctx.number("warnings")!;
    const action = ctx.string("action") as "timeout" | "kick" | "ban" | null;
    if (!Number.isInteger(warnings) || warnings < 1)
      throw new UserError(
        "The warning threshold must be a positive whole number.",
      );

    if (!action) {
      const removed = await setPunishment(ctx.guild!.id, warnings);
      if (!removed)
        throw new UserError(
          `There is no punishment at **${warnings}** warnings.`,
        );
      return ctx.reply(
        embeds.success(`Removed the punishment at **${warnings}** warnings.`),
      );
    }

    const length =
      action === "timeout"
        ? duration(ctx.string("duration") ?? "1h")
        : undefined;
    if (action === "timeout" && (!length || length > 28 * 86_400_000))
      throw new UserError(
        "Timeout punishments must be between 1 second and 28 days.",
      );
    await setPunishment(ctx.guild!.id, { warnings, action, duration: length });
    const punished =
      action === "timeout"
        ? "timed out"
        : action === "kick"
          ? "kicked"
          : "banned";
    return ctx.reply(
      embeds.success(
        `At **${warnings}** warnings, members will be **${punished}**.`,
      ),
    );
  },
});
