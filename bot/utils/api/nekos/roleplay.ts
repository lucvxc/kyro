import { cmd, container, UserError, type Context } from "../../../../index.ts";
import { neko } from "./index.ts";

export function solo(name: string, action: string) {
  return make(name, action, (ctx) => `${ctx.author} ${action}`);
}

export function target(
  name: string,
  action: string,
  after = "",
  endpoint = name,
) {
  const phrase = `${action} someone${after ? ` ${after}` : ""}`;
  return make(
    name,
    phrase,
    (ctx) => {
      const user = ctx.user("user") ?? "themselves";
      return `${ctx.author} ${action} ${user}${after ? ` ${after}` : ""}`;
    },
    true,
    endpoint,
  );
}

function make(
  name: string,
  description: string,
  text: (ctx: Context) => string,
  targeted = false,
  endpoint = name,
) {
  return cmd({
    name,
    description: `${description[0]!.toUpperCase()}${description.slice(1)}.`,
    type: "hybrid",
    syntax: `${name}${targeted ? " @user" : ""}`,
    example: `${name}${targeted ? " @lucvmf" : ""}`,
    args: targeted
      ? { user: { type: "user", description: "The user to interact with" } }
      : undefined,
    run: (ctx) => send(ctx, endpoint, text(ctx)),
  });
}

async function send(
  ctx: Context,
  endpoint: string,
  text: string,
): Promise<void> {
  const gif = await neko(endpoint);
  if (!gif) throw new UserError("I couldn't load that roleplay GIF.");

  return ctx.reply(
    container()
      .accent(await ctx.stats.accent())
      .text(text)
      .gallery({ url: gif.url, description: gif.anime }),
  );
}
