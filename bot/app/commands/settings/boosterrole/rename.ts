import { cmd } from "../../../../../index.ts";
import { personalBoosterRole } from "../../../../features/boosterroles/index.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "boosterrole rename",
  aliases: ["booster rename"],
  description: "Rename your personal booster role.",
  syntax: "boosterrole rename <name>",
  example: "boosterrole rename example",
  type: "message",
  context: "guild",
  args: {
    name: { type: "string", required: true, description: "New role name" },
  },
  run: async (ctx) => {
    const member = await ctx.guild!.members.fetch(ctx.author.id);
    const role = await personalBoosterRole(member, true);
    await role.setName(
      ctx.string("name")!.slice(0, 100),
      "Booster renamed personal role",
    );
    return ctx.reply(
      embeds.success(`Renamed your booster role to **${role.name}**.`),
    );
  },
});
