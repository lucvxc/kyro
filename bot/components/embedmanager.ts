import { PermissionFlagsBits } from "discord.js";
import { cmp, UserError } from "../../index.ts";
import { savedEmbed } from "../services/settings/embeds.ts";
import { parseEmbedFormat, parseGeneric } from "../utils/parser.ts";

export default cmp({
  id: /^embedmgr:\d+$/,
  context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages],
  run: async ctx => {
    const ownerId = ctx.params[0];
    if (ctx.user.id !== ownerId) throw new UserError("That embed menu belongs to someone else.");
    const id = ctx.values[0];
    if (!id) throw new UserError("Select an embed to preview.");

    const saved = await savedEmbed(ctx.guild!.id, ctx.user.id, id);
    const preview = parseEmbedFormat(parseGeneric(saved.code, ctx.guild!, ctx.user));
    if (!preview.embed.empty) return ctx.reply(preview.embed);
    return ctx.reply(preview.content || "This embed has no previewable content.");
  },
});
