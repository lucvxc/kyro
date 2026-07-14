import { cmd } from "../../../index.ts";

export default cmd({
  name: "lastfm account",
  description: "View your connected Last.fm account",
  type: "hybrid",
  aliases: ["lfm account", "lastfm acc"],
  args: {
    user: {
      type: "user",
      description: "The user whose Last.fm account you want to view",
    },
  },
  run: (ctx) => {
    const user = ctx.user("user") ?? ctx.author;
    return ctx.reply(`Account command received for ${user.username}.`);
  },
});
