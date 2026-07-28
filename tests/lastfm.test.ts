import { afterEach, describe, expect, test } from "bun:test";

import { loginUrl } from "../bot/api/routes/lastfm.ts";

const env = {
  key: process.env.LASTFM,
  base: process.env.BASEURL,
  callback: process.env.CALLBACK,
};

afterEach(() => {
  process.env.LASTFM = env.key;
  process.env.BASEURL = env.base;
  process.env.CALLBACK = env.callback;
});

describe("Last.fm authentication", () => {
  test("returns to the API callback instead of the dashboard", () => {
    process.env.LASTFM = "key";
    process.env.BASEURL = "https://api.example.com";
    process.env.CALLBACK = "https://example.com";

    const auth = new URL(loginUrl("123"));
    const callback = new URL(auth.searchParams.get("cb")!);

    expect(callback.origin).toBe("https://api.example.com");
    expect(callback.pathname).toBe("/lastfm/callback");
    expect(callback.searchParams.get("state")).toBeTruthy();
  });
});
