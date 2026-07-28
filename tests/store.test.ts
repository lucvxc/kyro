import { describe, expect, test } from "bun:test";
import { store } from "../index.ts";

describe("Store", () => {
  test("caches reads, deduplicates pending loads, and writes through", async () => {
    let loads = 0;
    let saved = "";
    const values = store<string, string>({
      load: async (key) => {
        loads += 1;
        await Promise.resolve();
        return `loaded:${key}`;
      },
      save: (_key, value) => {
        saved = value;
      },
    });

    const [one, two] = await Promise.all([
      values.get("guild"),
      values.get("guild"),
    ]);
    expect([one, two]).toEqual(["loaded:guild", "loaded:guild"]);
    expect(loads).toBe(1);
    expect(await values.set("guild", "new")).toBe("new");
    expect(saved).toBe("new");
    expect(await values.get("guild")).toBe("new");
  });

  test("supports cache priming and invalidation", async () => {
    const values = store<string, number>({ load: () => 1 });
    values.prime("key", 2);
    expect(await values.get("key")).toBe(2);
    values.delete("key");
    expect(await values.get("key")).toBe(1);
  });
});
