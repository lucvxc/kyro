import { cmd, UserError } from "../../../../index.ts";
import { requireSecurityAccess } from "../../../services/security/access.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import type { AntiNukeProtectionName } from "../../../utils/config/schema.ts";
import embeds from "../../../utils/config/embeds.ts";

const protections = [
  "channelcreate",
  "channeldelete",
  "rolecreate",
  "roledelete",
  "ban",
  "kick",
  "webhook",
  "botadd",
  "administrator",
  "prune",
] as const;
export default cmd({
  name: "antinuke set",
  description: "Set a protection threshold and time window.",
  syntax: "antinuke set <protection> <threshold> <window>",
  example: "antinuke set protection 5 5",
  type: "message",
  context: "guild",
  args: {
    protection: { type: "string", required: true },
    threshold: { type: "number", required: true },
    window: { type: "number", required: true },
  },
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.author.id, current.admins);
    const name = ctx
      .string("protection")
      ?.toLowerCase() as AntiNukeProtectionName;
    const threshold = ctx.number("threshold")!;
    const window = ctx.number("window")!;
    if (!protections.includes(name))
      throw new UserError(`Choose one of: ${protections.join(", ")}.`);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 25)
      throw new UserError("Threshold must be between 1 and 25.");
    if (!Number.isInteger(window) || window < 1 || window > 300)
      throw new UserError("Window must be between 1 and 300 seconds.");
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: {
        ...value.antinuke,
        protections: {
          ...value.antinuke.protections,
          [name]: { ...value.antinuke.protections[name], threshold, window },
        },
      },
    }));
    return ctx.reply(
      embeds.success(
        `**${name}** now triggers at **${threshold}** actions in **${window}s**.`,
      ),
    );
  },
});
