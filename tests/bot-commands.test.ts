import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { compileSlash } from "../src/commands/Compiler.ts";
import { Loader } from "../src/commands/Loader.ts";
import { Registry } from "../src/commands/Registry.ts";

describe("example bot commands", () => {
  test("loads every info and roleplay command within Discord's global limit", async () => {
    const registry = new Registry();
    await new Loader(
      registry,
      resolve(import.meta.dir, "..", "bot", "commands"),
    ).load();

    expect(registry.catalog.category("info")?.commands.length).toBe(23);
    expect(registry.catalog.category("roleplay")?.commands.length).toBe(59);
    expect(
      registry.catalog.subs("fakepermissions").map((command) => command.name),
    ).toEqual([
      "fakepermissions clear",
      "fakepermissions grant",
      "fakepermissions list",
      "fakepermissions revoke",
    ]);
    expect(compileSlash(registry.values()).length).toBeLessThanOrEqual(100);
    for (const command of registry.values()) {
      expect(
        command.description,
        `${command.name} needs a description`,
      ).toBeTruthy();
      expect(command.syntax, `${command.name} needs syntax`).toBeTruthy();
      expect(command.example, `${command.name} needs an example`).toBeTruthy();
    }
  });
});
