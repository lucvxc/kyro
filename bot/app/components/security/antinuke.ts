import { cmp, modal, UserError, type CmpContext } from "../../../../index.ts";
import { requireSecurityAccess } from "../../../features/security/access.ts";
import { bool, int } from "../../../features/security/fields.ts";
import { antiNukePanel } from "../../../features/security/panels.ts";
import {
  defaultAntiNuke,
  recommendedAntiNuke,
  securitySettings,
  updateSecurity,
} from "../../../features/settings/security.ts";
import type {
  AntiNukeProtectionName,
  AntiNukeSettings,
} from "../../../db/settings.ts";

const punishments = ["ban", "kick", "timeout", "strip"] as const;

export default cmp({
  id: /^security:nuke:(?:select|toggle|recommended|reset|edit):/,
  context: "guild",
  run: async (ctx) => {
    const [, , action, owner, name] = ctx.id.split(":");
    check(ctx, owner);
    const settings = (await securitySettings(ctx.guild!.id)).antinuke;
    requireSecurityAccess(ctx.guild!, ctx.user.id, settings.admins);

    if (action === "select") return open(ctx, owner!, ctx.values[0]!, settings);
    if (action === "edit" && name) {
      await save(ctx, name);
      return ctx.private("Configuration updated.");
    }

    await updateSecurity(ctx.guild!.id, (state) => {
      if (action === "toggle") {
        return {
          ...state,
          antinuke: { ...state.antinuke, enabled: !state.antinuke.enabled },
        };
      }
      if (action === "recommended") {
        return {
          ...state,
          antinuke: {
            ...recommendedAntiNuke(),
            admins: state.antinuke.admins,
            whitelist: state.antinuke.whitelist,
          },
        };
      }
      if (action === "reset") return { ...state, antinuke: defaultAntiNuke() };
      throw new UserError("Unknown AntiNuke action.");
    });

    const next = (await securitySettings(ctx.guild!.id)).antinuke;
    return ctx.update(antiNukePanel(next, owner!));
  },
});

function open(
  ctx: CmpContext,
  owner: string,
  name: string,
  settings: AntiNukeSettings,
) {
  if (name === "punishment") {
    return ctx.showModal(
      modal({
        id: `security:nuke:edit:${owner}:punishment`,
        title: "AntiNuke Punishment",
        inputs: [
          { id: "action", label: "Punishment", value: settings.punishment },
        ],
      }),
    );
  }
  const item = settings.protections[name as AntiNukeProtectionName];
  if (!item) throw new UserError("That protection no longer exists.");
  return ctx.showModal(
    modal({
      id: `security:nuke:edit:${owner}:${name}`,
      title: `Configure ${name}`,
      inputs: [
        { id: "enabled", label: "Enabled", value: String(item.enabled) },
        { id: "threshold", label: "Threshold", value: String(item.threshold) },
        {
          id: "window",
          label: "Window in seconds",
          value: String(item.window),
        },
      ],
    }),
  );
}

async function save(ctx: CmpContext, name: string) {
  if (name === "punishment") {
    const value = ctx
      .field("action")
      ?.toLowerCase() as AntiNukeSettings["punishment"];
    if (!punishments.includes(value))
      throw new UserError(`Choose one of: ${punishments.join(", ")}.`);
    return updateSecurity(ctx.guild!.id, (state) => ({
      ...state,
      antinuke: { ...state.antinuke, punishment: value },
    }));
  }
  const key = name as AntiNukeProtectionName;
  return updateSecurity(ctx.guild!.id, (state) => ({
    ...state,
    antinuke: {
      ...state.antinuke,
      protections: {
        ...state.antinuke.protections,
        [key]: {
          ...state.antinuke.protections[key],
          enabled: bool(ctx.field("enabled")),
          threshold: int(ctx.field("threshold"), 1, 25),
          window: int(ctx.field("window"), 1, 300),
        },
      },
    },
  }));
}

function check(ctx: CmpContext, owner?: string) {
  if (!owner || ctx.user.id !== owner)
    throw new UserError("This configuration panel is not yours.");
}
