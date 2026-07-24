import { cmp, modal, UserError, type CmpContext } from "../../../index.ts";
import { requireSecurityAccess } from "../../services/security/access.ts";
import { bool, int } from "../../services/security/fields.ts";
import { lockGuild, unlockGuild } from "../../services/security/lockdown.ts";
import { antiRaidPanel } from "../../services/security/panels.ts";
import {
  defaultAntiRaid,
  recommendedAntiRaid,
  securitySettings,
  updateSecurity,
} from "../../services/settings/security.ts";
import type {
  AntiRaidSettings,
  RaidAction,
} from "../../utils/config/schema.ts";

type Name = keyof AntiRaidSettings["protections"];
const actions = [
  "ban",
  "kick",
  "timeout",
  "softban",
  "delete",
  "none",
] as const;

export default cmp({
  id: /^security:raid:(?:select|toggle|recommended|reset|lockdown|edit):/,
  context: "guild",
  run: async (ctx) => {
    const [, , action, owner, name] = ctx.id.split(":");
    if (!owner || ctx.user.id !== owner)
      throw new UserError("This configuration panel is not yours.");
    const cfg = (await securitySettings(ctx.guild!.id)).antiraid;
    requireSecurityAccess(ctx.guild!, ctx.user.id, cfg.admins);

    if (action === "select") return open(ctx, owner, ctx.values[0]!, cfg);
    if (action === "edit" && name) {
      await save(ctx, name as Name);
      return ctx.private("Configuration updated.");
    }
    if (action === "lockdown") {
      if (cfg.lockdown.active) await unlockGuild(ctx.guild!);
      else await lockGuild(ctx.guild!);
    } else {
      await updateSecurity(ctx.guild!.id, (state) => {
        if (action === "toggle")
          return {
            ...state,
            antiraid: { ...state.antiraid, enabled: !state.antiraid.enabled },
          };
        if (action === "recommended")
          return {
            ...state,
            antiraid: {
              ...recommendedAntiRaid(),
              admins: state.antiraid.admins,
              whitelist: state.antiraid.whitelist,
            },
          };
        if (action === "reset")
          return { ...state, antiraid: defaultAntiRaid() };
        throw new UserError("Unknown AntiRaid action.");
      });
    }

    const next = (await securitySettings(ctx.guild!.id)).antiraid;
    return ctx.update(antiRaidPanel(next, owner));
  },
});

function open(
  ctx: CmpContext,
  owner: string,
  name: string,
  cfg: AntiRaidSettings,
) {
  const item = cfg.protections[name as Name];
  if (!item) throw new UserError("That protection no longer exists.");
  const amount =
    "threshold" in item
      ? item.threshold
      : "minimumDays" in item
        ? item.minimumDays
        : 1;
  return ctx.showModal(
    modal({
      id: `security:raid:edit:${owner}:${name}`,
      title: `Configure ${name}`,
      inputs: [
        { id: "enabled", label: "Enabled", value: String(item.enabled) },
        { id: "action", label: "Action", value: item.action },
        {
          id: "amount",
          label: "Threshold or minimum days",
          value: String(amount),
        },
        {
          id: "window",
          label: "Window in seconds",
          value: String("window" in item ? item.window : 10),
          required: false,
        },
      ],
    }),
  );
}

async function save(ctx: CmpContext, name: Name) {
  const action = ctx.field("action")?.toLowerCase() as RaidAction;
  if (!actions.includes(action))
    throw new UserError(`Choose one of: ${actions.join(", ")}.`);
  const enabled = bool(ctx.field("enabled"));
  const amount = int(ctx.field("amount"), 1, 100);
  const window = int(ctx.field("window") || "10", 1, 300);
  return updateSecurity(ctx.guild!.id, (state) => {
    const item = state.antiraid.protections[name];
    const next =
      "minimumDays" in item
        ? { ...item, enabled, action, minimumDays: amount }
        : "threshold" in item
          ? { ...item, enabled, action, threshold: amount, window }
          : { ...item, enabled, action };
    return {
      ...state,
      antiraid: {
        ...state.antiraid,
        protections: { ...state.antiraid.protections, [name]: next },
      },
    };
  });
}
