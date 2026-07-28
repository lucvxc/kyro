import { button, container, select } from "../../../index.ts";
import { colors } from "../../shared/config/constants.ts";
import type { AntiNukeSettings, AntiRaidSettings } from "../../db/settings.ts";

export function antiNukePanel(config: AntiNukeSettings, userId: string) {
  const enabled = Object.values(config.protections).filter(
    (item) => item.enabled,
  ).length;
  return container()
    .accent(colors.default)
    .text(
      `## AntiNuke Configuration\n-# ${config.enabled ? "Enabled" : "Disabled"} · ${enabled}/${Object.keys(config.protections).length} protections · Punishment ${config.punishment}`,
    )
    .separator()
    .row(
      select({
        id: `security:nuke:select:${userId}`,
        placeholder: "Configure a protection...",
        options: [
          ...Object.entries(config.protections).map(([name, item]) => ({
            label: label(name),
            value: name,
            description: `${item.enabled ? "Enabled" : "Disabled"} · ${item.threshold} in ${item.window}s`,
          })),
          {
            label: "Punishment",
            value: "punishment",
            description: config.punishment,
          },
        ],
      }),
    )
    .row(
      button({
        id: `security:nuke:toggle:${userId}`,
        label: config.enabled ? "Disable" : "Enable",
        style: "secondary",
      }),
      button({
        id: `security:nuke:recommended:${userId}`,
        label: "Recommended",
        style: "secondary",
      }),
      button({
        id: `security:nuke:reset:${userId}`,
        label: "Reset",
        style: "secondary",
      }),
    );
}

export function antiRaidPanel(config: AntiRaidSettings, userId: string) {
  return container()
    .accent(colors.default)
    .text(
      `## AntiRaid Configuration\n-# ${config.enabled ? "Enabled" : "Disabled"} · Lockdown ${config.lockdown.active ? "active" : `${config.lockdown.duration} minutes`}`,
    )
    .separator()
    .row(
      select({
        id: `security:raid:select:${userId}`,
        placeholder: "Configure a protection...",
        options: Object.entries(config.protections).map(([name, item]) => ({
          label: label(name),
          value: name,
          description: describeRaid(item),
        })),
      }),
    )
    .row(
      button({
        id: `security:raid:toggle:${userId}`,
        label: config.enabled ? "Disable" : "Enable",
        style: "secondary",
      }),
      button({
        id: `security:raid:recommended:${userId}`,
        label: "Recommended",
        style: "secondary",
      }),
      button({
        id: `security:raid:lockdown:${userId}`,
        label: config.lockdown.active ? "Unlock" : "Lockdown",
        style: "secondary",
      }),
      button({
        id: `security:raid:reset:${userId}`,
        label: "Reset",
        style: "secondary",
      }),
    );
}

function label(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/message$/, " message")
    .replace(/^./, (letter) => letter.toUpperCase());
}
function describeRaid(value: {
  enabled: boolean;
  action: string;
  threshold?: number;
  window?: number;
  minimumDays?: number;
}) {
  const limit = value.minimumDays
    ? `${value.minimumDays} days`
    : value.threshold
      ? `${value.threshold} in ${value.window}s`
      : value.action;
  return `${value.enabled ? "Enabled" : "Disabled"} · ${limit} · ${value.action}`;
}
