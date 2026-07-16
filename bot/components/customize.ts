import { PermissionFlagsBits } from "discord.js";
import { cmp, modal, UserError } from "../../index.ts";
import { clean, customize, effect, font, image, styleColors } from "../utils/customize.ts";
import embeds from "../utils/config/embeds.ts";

export default cmp({
  id: /^customize:(name|profile|save)$/,
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async ctx => {
    if (ctx.interaction.isButton()) {
      const member = ctx.guild!.members.me ?? await ctx.guild!.members.fetchMe();
      return ctx.showModal(ctx.id === "customize:profile" ? profile() : name(member.displayName));
    }

    const displayNameStyle = style(ctx.strings("font")[0], ctx.strings("effect")[0], ctx.field("hex1"), ctx.field("hex2"));
    await customize(ctx.client, ctx.guild!, clean({
      nick: ctx.field("name") ?? undefined,
      avatar: await image(ctx.files("avatar")[0]),
      banner: await image(ctx.files("banner")[0]),
      ...displayNameStyle,
    }));

    return ctx.reply(embeds.success("Updated my server customization."));
  },
  error: async (error, ctx) => {
    const message = error instanceof Error || error instanceof UserError
      ? error.message
      : "I could not update that customization.";
    if (!ctx.interaction.replied && !ctx.interaction.deferred) await ctx.reply(embeds.error(message));
  },
});

function name(current: string) {
  return modal({
    id: "customize:save",
    title: "Customize Name",
    inputs: [
      { id: "name", label: "Server name", value: current, required: false, max: 32 },
      {
        type: "string",
        id: "font",
        label: "Font",
        required: false,
        min: 0,
        options: [
          { label: "Vampyre", value: "vampyre" },
          { label: "8-Bit", value: "eightbit" },
          { label: "Medieval", value: "medieval" },
          { label: "Modern", value: "modern" },
          { label: "Jellybean", value: "jellybean" },
          { label: "Sakura", value: "sakura" },
          { label: "Tempo", value: "tempo" },
          { label: "GG Sans (Regular)", value: "ggsans" },
        ],
      },
      {
        type: "string",
        id: "effect",
        label: "Effect",
        required: false,
        min: 0,
        options: [
          { label: "Solid", value: "solid" },
          { label: "Gradient", value: "gradient" },
          { label: "Neon", value: "neon" },
          { label: "Toon", value: "toon" },
          { label: "Pop", value: "pop" },
        ],
      },
      { id: "hex1", label: "Hex 1", placeholder: "#FFFFFF", required: false, max: 7 },
      { id: "hex2", label: "Hex 2", placeholder: "#A8D694", required: false, max: 7 },
    ],
  });
}

function profile() {
  return modal({
    id: "customize:save",
    title: "Customize Profile",
    inputs: [
      { type: "file", id: "avatar", label: "Avatar", description: "Upload a new server avatar.", required: false, max: 1 },
      { type: "file", id: "banner", label: "Banner", description: "Upload a new server banner.", required: false, max: 1 },
    ],
  });
}

function style(fontName?: string, effectName?: string, hex1?: string | null, hex2?: string | null) {
  const selected = styleColors(effectName, hex1, hex2);
  if (!fontName && !effectName && !selected) return {};

  return {
    display_name_font_id: font(fontName),
    display_name_effect_id: effect(effectName),
    display_name_colors: selected,
  };
}
