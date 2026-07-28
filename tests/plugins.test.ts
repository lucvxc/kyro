import { describe, expect, test } from "bun:test";
import type { Kyro } from "../src/Kyro.ts";
import { Loader } from "../src/plugins/Loader.ts";

describe("plugin Loader", () => {
  test("rolls back plugins when a later setup fails", async () => {
    const calls: string[] = [];
    const loader = new Loader([
      {
        name: "first",
        setup: () => {
          calls.push("first setup");
        },
        stop: () => {
          calls.push("first stop");
        },
      },
      {
        name: "broken",
        setup: () => {
          throw new Error("broken setup");
        },
      },
    ]);

    await expect(loader.load({} as Kyro)).rejects.toThrow("broken setup");
    expect(calls).toEqual(["first setup", "first stop"]);
  });
});
