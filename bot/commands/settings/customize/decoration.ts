import { PermissionFlagsBits } from "discord.js";
import { cmd } from "../../../../index.ts";
import { clean, customize, effect, font, styleColors } from "../../../utils/customize.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "customize style",
  aliases: ["customize decoration"],
  description: "Change the bot's display name style.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "customize style (font) (effect) (colors)",
  example: "customize style jellybean gradient #FFFFFF #A8D694",
  args: {
    font: { type: "string", description: "Font name or ID" },
    effect: { type: "string", description: "Effect name or ID" },
    colors: { type: "string", description: "Hex colors" },
  },
  run: async ctx => {
    const effectName = ctx.string("effect") ?? "solid";
    const [hex1, hex2] = ctx.string("colors")?.split(/\s+/) ?? [];

    await customize(ctx.client, ctx.guild!, clean({
      display_name_font_id: font(ctx.string("font")) ?? 4,
      display_name_effect_id: effect(effectName) ?? 1,
      display_name_colors: styleColors(effectName, hex1, hex2) ?? [16777215],
    }));

    return ctx.reply(embeds.success("Updated my display name style."));
  },
});
