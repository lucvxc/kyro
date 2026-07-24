import { MessageFlags, type MessageCreateOptions } from "discord.js";
import { button, container, embed, row, select, thumb } from "../../../index.ts";
import { colors, emojis } from "../../utils/config/constants.ts";

export type VoiceMasterPanelType = "dropdown" | "container" | "embed";

const actions = [
  ["Lock", "vm_lock", emojis.voicemaster.lock],
  ["Unlock", "vm_unlock", emojis.voicemaster.unlock],
  ["Hide", "vm_hide", emojis.voicemaster.ghost],
  ["Reveal", "vm_unhide", emojis.voicemaster.reveal],
  ["Info", "vm_info", emojis.voicemaster.information],
  ["Claim", "vm_claim", emojis.voicemaster.claim],
  ["Rename", "vm_rename", emojis.voicemaster.rename],
  ["Limit", "vm_limit", emojis.voicemaster.limit],
  ["Bitrate", "vm_bitrate", emojis.voicemaster.bitrate],
  ["Disconnect", "vm_disconnect", emojis.voicemaster.disconnect],
] as const;

export function voiceMasterPanel(
  type: VoiceMasterPanelType,
  icon?: string | null,
): MessageCreateOptions {
  if (type === "dropdown") {
    const panel = container()
      .accent(colors.default)
      .section(
        "## VoiceMaster\n-# Join **Join to Create**, then use this menu to control your channel.",
        icon ? thumb(icon) : undefined,
      )
      .separator()
      .row(
        select({
          id: "vm_dropdown",
          placeholder: "Control your voice channel...",
          options: actions.map(([label, value, iconValue]) => ({
            label,
            value,
            emoji: emoji(iconValue),
          })),
        }),
      );
    return { flags: MessageFlags.IsComponentsV2, components: [panel.toJSON()] };
  }

  const controls = actions.map(([label, id, iconValue]) =>
    button({
      id,
      label: type === "embed" ? undefined : label,
      style: "secondary",
      emoji: emoji(iconValue),
    }),
  );

  if (type === "container") {
    const panel = container()
      .accent(colors.default)
      .section(
        "## VoiceMaster Control Panel\n-# Manage your temporary channel below.",
        icon ? thumb(icon) : undefined,
      )
      .separator()
      .row(...controls.slice(0, 5))
      .row(...controls.slice(5, 10));
    return { flags: MessageFlags.IsComponentsV2, components: [panel.toJSON()] };
  }

  const card = embed({
    color: colors.default,
    title: "VoiceMaster Control Panel",
    description: actions
      .map(([label, , iconValue]) => `${iconValue} **${label}**`)
      .join("\n"),
    thumbnail: icon ?? undefined,
  });
  return {
    embeds: [card.toJSON()],
    components: [row(...controls.slice(0, 5)), row(...controls.slice(5, 10))],
  };
}

function emoji(value: string) {
  const custom = value.match(/^<a?:([\w]+):(\d+)>$/);
  return custom ? { name: custom[1], id: custom[2] } : { name: value };
}
