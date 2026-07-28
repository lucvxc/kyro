import { cmd } from "../../../../../index.ts";
import { requireOwner } from "../../../../features/security/access.ts";
import {
  defaultAntiNuke,
  updateSecurity,
} from "../../../../features/settings/security.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "antinuke reset",
  aliases: ["an reset"],
  description: "Reset AntiNuke to its defaults.",
  syntax: "antinuke reset",
  example: "antinuke reset",
  type: "message",
  context: "guild",
  run: async (ctx) => {
    requireOwner(ctx.guild!, ctx.author.id);
    await updateSecurity(ctx.guild!.id, (value) => ({
      ...value,
      antinuke: defaultAntiNuke(),
    }));
    return ctx.reply(embeds.success("AntiNuke reset and disabled."));
  },
});
