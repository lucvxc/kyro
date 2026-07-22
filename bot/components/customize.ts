import { PermissionFlagsBits } from "discord.js";
import {
  botProfileEffects,
  botProfileFonts,
  cmp,
  modal,
  UserError,
} from "../../index.ts";
import embeds from "../utils/config/embeds.ts";

export default cmp({
  id: /^customize:(name|profile|save)$/,
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    if (ctx.interaction.isButton()) {
      const member =
        ctx.guild!.members.me ?? (await ctx.guild!.members.fetchMe());
      return ctx.showModal(
        ctx.id === "customize:profile" ? profile() : name(member.displayName),
      );
    }

    const font = ctx.strings("font")[0];
    const effect = ctx.strings("effect")[0];
    const colors = [ctx.field("hex1"), ctx.field("hex2")].filter(
      (value): value is string => Boolean(value),
    );
    await ctx.server.profile.update({
      name: ctx.field("name") ?? undefined,
      avatar: ctx.files("avatar")[0],
      banner: ctx.files("banner")[0],
      style:
        font || effect || colors.length ? { font, effect, colors } : undefined,
    });

    return ctx.reply(embeds.success("Updated my server customization."));
  },
  error: async (error, ctx) => {
    const message =
      error instanceof Error || error instanceof UserError
        ? error.message
        : "I could not update that customization.";
    if (!ctx.interaction.replied && !ctx.interaction.deferred)
      await ctx.reply(embeds.error(message));
  },
});

function name(current: string) {
  return modal({
    id: "customize:save",
    title: "Customize Name",
    inputs: [
      {
        id: "name",
        label: "Server name",
        value: current,
        required: false,
        max: 32,
      },
      {
        type: "string",
        id: "font",
        label: "Font",
        required: false,
        min: 0,
        options: Object.keys(botProfileFonts).map((value) => ({
          label: label(value),
          value,
        })),
      },
      {
        type: "string",
        id: "effect",
        label: "Effect",
        required: false,
        min: 0,
        options: Object.keys(botProfileEffects).map((value) => ({
          label: label(value),
          value,
        })),
      },
      {
        id: "hex1",
        label: "Hex 1",
        placeholder: "#FFFFFF",
        required: false,
        max: 7,
      },
      {
        id: "hex2",
        label: "Hex 2",
        placeholder: "#A8D694",
        required: false,
        max: 7,
      },
    ],
  });
}

function profile() {
  return modal({
    id: "customize:save",
    title: "Customize Profile",
    inputs: [
      {
        type: "file",
        id: "avatar",
        label: "Avatar",
        description: "Upload a new server avatar.",
        required: false,
        max: 1,
      },
      {
        type: "file",
        id: "banner",
        label: "Banner",
        description: "Upload a new server banner.",
        required: false,
        max: 1,
      },
    ],
  });
}

function label(value: string): string {
  return value === "ggsans"
    ? "GG Sans"
    : value === "eightbit"
      ? "8-Bit"
      : value[0]!.toUpperCase() + value.slice(1);
}
