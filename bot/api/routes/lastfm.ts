import { randomUUID } from "node:crypto";
import type { Client } from "discord.js";
import { Hono } from "hono";
import { session } from "../../features/lastfm/client.ts";
import { link } from "../../features/lastfm/users.ts";

const pending = new Map<string, { user: string; expires: number }>();

export function loginUrl(user: string): string {
  const key = process.env.LASTFM;
  const callback = callbackUrl();
  if (!key || !callback)
    throw new Error("Last.fm authentication is not configured.");

  const state = randomUUID().replaceAll("-", "");
  pending.set(state, { user, expires: Date.now() + 10 * 60_000 });

  const target = new URL(callback);
  target.searchParams.set("state", state);

  const url = new URL("https://www.last.fm/api/auth/");
  url.searchParams.set("api_key", key);
  url.searchParams.set("cb", target.toString());
  return url.toString();
}

function callbackUrl(): string | undefined {
  const base = process.env.BASEURL;
  return base ? new URL("/lastfm/callback", base).toString() : undefined;
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
      const redirect = resultUrl("success", auth.name);
      if (redirect) return ctx.redirect(redirect);
      return ctx.html(
        page(
          `Last.fm account ${escape(auth.name)} linked. You can close this page.`,
        ),
      );
    } catch {
      const redirect = resultUrl("failed");
      if (redirect) return ctx.redirect(redirect);
      return ctx.html(
        page("Last.fm could not link this account. Try again."),
        500,
      );
    }
  });

  return app;
}

function resultUrl(result: "success" | "failed", username?: string) {
  const base = process.env.CALLBACK;
  if (!base) return undefined;
  const url = new URL(`/fm/link/${result}`, base);
  if (username) url.searchParams.set("username", username);
  return url.toString();
}

function page(msg: string): string {
  return `<!doctype html><meta name="viewport" content="width=device-width"><title>Last.fm</title><body style="font:16px system-ui;background:#111;color:#eee;display:grid;place-items:center;height:100vh;margin:0"><main><h1>Last.fm</h1><p>${msg}</p></main></body>`;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
