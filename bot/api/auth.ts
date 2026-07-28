import { timingSafeEqual } from "node:crypto";
import type { Context } from "hono";

export function dashboardAuth(ctx: Context) {
  const expected = process.env.DASHBOARDKEY ?? process.env.APIKEY;
  if (!expected)
    return ctx.json(
      { error: "Dashboard API authentication is not configured" },
      503,
    );
  const auth = ctx.req.header("authorization");
  const provided = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : ctx.req.header("x-api-key");
  if (!provided || !equal(provided, expected))
    return ctx.json({ error: "Unauthorized" }, 401);
  return null;
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
