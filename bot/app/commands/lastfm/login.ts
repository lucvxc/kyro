import {
  button,
  cmd,
  container,
  messageOptions,
  UserError,
} from "../../../../index.ts";
import { loginUrl } from "../../../api/routes/lastfm.ts";
import { account } from "../../../features/lastfm/users.ts";
import { colors } from "../../../shared/config/constants.ts";

export default cmd({
  name: "lastfm login",
  aliases: ["fm login", "lf login", "lastfm link"],
  description: "Authenticate and link your Last.fm account.",
  syntax: "lastfm login",
  example: "lastfm login",
  type: "message",
  context: "both",
  run: async (ctx) => {
    const current = await account(ctx.author.id, false);
    if (current?.lastfm)
      throw new UserError(
        `Your Last.fm account **${current.lastfm}** is already linked.`,
      );
    let url: string;
    try {
      url = loginUrl(ctx.author.id);
    } catch {
      throw new UserError("Last.fm authentication is not configured yet.");
    }
    const card = container()
      .accent(colors.default)
      .text(
        "## Link Last.fm\nAuthorize your Last.fm account to connect it to Discord.\n-# This link expires in 10 minutes.",
      )
      .row(button({ label: "Continue to Last.fm", style: "link", url }));

    try {
      await ctx.author.send(messageOptions(card) as never);
    } catch {
      throw new UserError("Open your DMs and run this command again.");
    }

    await ctx.message?.react("\u{1F4E9}");
  },
});
