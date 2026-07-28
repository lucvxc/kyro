import { afterEach, describe, expect, test } from "bun:test";
import { container } from "../index.ts";
import { pick, giveawayUrl } from "../bot/features/giveaways/index.ts";
import { parseDelay } from "../bot/features/reminders/index.ts";
import {
  clearSnipes,
  deletedAt,
  editedAt,
  saveDelete,
  saveEdit,
} from "../bot/features/snipe/store.ts";
import { findTimezones, timezone } from "../bot/features/timezone/index.ts";

describe("runtime feature contracts", () => {
  afterEach(() => clearSnipes("runtime"));

  test("keeps the framework container visually neutral", () => {
    expect(container().text("test").toJSON()).not.toHaveProperty(
      "accent_color",
    );
  });

  test("parses bounded scheduler durations", () => {
    expect(parseDelay("30m")).toBe(1_800_000);
    expect(parseDelay("1w")).toBe(604_800_000);
    expect(parseDelay("2s")).toBeNull();
    expect(parseDelay("forever")).toBeNull();
  });

  test("resolves friendly timezone input", () => {
    expect(timezone("PST")).toBe("America/Los_Angeles");
    expect(timezone("Los Angeles")).toBe("America/Los_Angeles");
    expect(timezone("UTC")).toBe("UTC");
    expect(findTimezones("new york")).toContain("America/New_York");
  });

  test("stores, retrieves, and clears both snipe types", () => {
    saveDelete("runtime", {
      authorId: "1",
      avatar: "avatar",
      content: "deleted",
      files: [],
      at: Date.now(),
    });
    saveEdit("runtime", {
      authorId: "1",
      avatar: "avatar",
      before: "a",
      after: "b",
      at: Date.now(),
    });
    expect(deletedAt("runtime", 0)?.content).toBe("deleted");
    expect(editedAt("runtime", 0)?.after).toBe("b");
    clearSnipes("runtime");
    expect(deletedAt("runtime", 0)).toBeUndefined();
    expect(editedAt("runtime", 0)).toBeUndefined();
  });

  test("selects unique giveaway winners and builds site links", () => {
    const winners = pick(["1", "2", "3"], 2);
    expect(winners).toHaveLength(2);
    expect(new Set(winners).size).toBe(2);
    const current = process.env.SITEURL;
    process.env.SITEURL = "https://june.test";
    expect(giveawayUrl("abc")).toBe("https://june.test/giveaway/abc");
    if (current === undefined) delete process.env.SITEURL;
    else process.env.SITEURL = current;
  });
});
