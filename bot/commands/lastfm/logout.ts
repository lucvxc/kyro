import { cmd, UserError } from "../../../index.ts";
import { account, unlink } from "../../services/lastfm/users.ts";
import embeds from "../../utils/config/embeds.ts";

export default cmd({
  name: "lastfm logout",
  aliases: ["fm logout", "lf logout", "lastfm unlink"],
  description: "Disconnect your Last.fm account.",
  syntax: "lastfm logout",
  example: "lastfm logout",
  type: "message",
  context: "both",
  run: async (ctx) => {
    const current = await account(ctx.author.id, false);
    if (!current?.lastfm)
      throw new UserError("You do not have a linked Last.fm account.");
    await unlink(ctx.author.id);
    return ctx.reply(embeds.success("Your Last.fm account was disconnected."));
  },
});
