import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { saveEmbed } from "../../../services/settings/embeds.ts";
import { isEmbedFormat } from "../../../utils/parser.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "embed save", description: "Save embed code with an optional name.", type: "message", context: "guild",
  permissions: [PermissionFlagsBits.ManageMessages], syntax: "embed save (name) <code>", example: "embed save rules $v{embed}$v{description:Read the rules}",
  run: async ctx => {
    const codeAt = ctx.raw.findIndex(isEmbedFormat);
    if (codeAt < 0) throw new UserError(`Use **${ctx.prefix}embed save (name) <code>**.`);
    const name = ctx.raw.slice(0, codeAt).join(" ") || undefined;
    const code = ctx.raw.slice(codeAt).join(" ");
    const result = await saveEmbed(ctx.guild!.id, ctx.author.id, name, code);
    return ctx.reply(embeds.success(
      `${result.created ? "Saved" : "Updated"} **${result.embed.name}** · ID **${result.embed.id}**.`,
    ));
  },
});
