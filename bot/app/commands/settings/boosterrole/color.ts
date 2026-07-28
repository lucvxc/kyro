import { resolveColor } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { personalBoosterRole } from "../../../../features/boosterroles/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boosterrole color",
  aliases: ["booster color"],
  description: "Change your personal booster role color.",
  syntax: "boosterrole color <color>",
  example: "boosterrole color #5865F2",
  type: "message",
  context: "guild",
  args: { color: { type: "string", required: true, description: "Hex color" } },
  run: async (ctx) => {
    const input = ctx.string("color")!;
    let color: number;
    try {
      color = resolveColor(input as `#${string}`);
    } catch {
      throw new UserError("Use a valid hex color like `#ff66aa`.");
    }
    const role = await personalBoosterRole(
      await ctx.guild!.members.fetch(ctx.author.id),
      true,
    );
    await role.setColor(color, "Booster changed personal role color");
    return ctx.reply(
      embeds.success(`Updated your booster role color to **${input}**.`),
    );
  },
});
