import { randomUUID } from "node:crypto";
import type { Client } from "discord.js";
import { Hono } from "hono";
import { session } from "../../services/lastfm/client.ts";
import { link } from "../../services/lastfm/users.ts";

const pending = new Map<string, { user: string; expires: number }>();

export function loginUrl(user: string): string {
  const key = process.env.LASTFM;
  const base = process.env.API_URL;
  if (!key || !base)
    throw new Error("Last.fm authentication is not configured.");

  const state = randomUUID().replaceAll("-", "");
  pending.set(state, { user, expires: Date.now() + 10 * 60_000 });

  const callback = new URL("/lastfm/callback", base);
  callback.searchParams.set("state", state);

  const url = new URL("https://www.last.fm/api/auth/");
  url.searchParams.set("api_key", key);
  url.searchParams.set("cb", callback.toString());
  return url.toString();
}

export function lastfmApi(client: Client) {
  const app = new Hono();

  app.get("/callback", async (ctx) => {
    const state = ctx.req.query("state");
    const token = ctx.req.query("token");
    const entry = state ? pending.get(state) : undefined;

    if (!state || !token || !entry || entry.expires < Date.now()) {
      return ctx.html(
        page("This login link expired. Run the command again."),
        400,
      );
    }

    pending.delete(state);
    try {
      const auth = await session(token);
      await link(entry.user, auth.name, auth.key);
      await client.users
        .fetch(entry.user)
        .then((user) =>
          user.send(`Your Last.fm account **${auth.name}** is now linked.`),
        )
        .catch(() => undefined);
      return ctx.html(
        page(
          `Last.fm account ${escape(auth.name)} linked. You can close this page.`,
        ),
      );
    } catch {
      return ctx.html(
        page("Last.fm could not link this account. Try again."),
        500,
      );
    }
  });

  return app;
}

function page(msg: string): string {
  return `<!doctype html><meta name="viewport" content="width=device-width"><title>Last.fm</title><body style="font:16px system-ui;background:#111;color:#eee;display:grid;place-items:center;height:100vh;margin:0"><main><h1>Last.fm</h1><p>${msg}</p></main></body>`;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
