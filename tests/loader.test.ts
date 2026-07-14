import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { Loader } from "../src/commands/Loader.ts";
import { Registry } from "../src/commands/Registry.ts";

describe("Loader", () => {
  test("loads default command exports recursively", async () => {
    const registry = new Registry();
    const directory = resolve(import.meta.dir, "fixtures", "commands");

    await new Loader(registry, directory).load();

    expect(registry.get("ping", "slash")?.description).toBe("Replies with pong");
  });
});
