import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { Loader } from "../src/commands/Loader.ts";
import { Registry } from "../src/commands/Registry.ts";
import { Loader as ComponentLoader } from "../src/components/Loader.ts";

describe("Loader", () => {
  test("loads default command exports recursively", async () => {
    const registry = new Registry();
    const directory = resolve(import.meta.dir, "fixtures", "commands");

    await new Loader(registry, directory).load();

    expect(registry.get("ping", "slash")?.description).toBe("Replies with pong");
    expect(registry.get("avatar", "slash")).toMatchObject({
      category: "info",
      syntax: "avatar (user)",
      example: "avatar @user",
    });
    expect(registry.get("alpha", "slash")?.description).toBe("First collected command");
    expect(registry.get("beta", "slash")?.description).toBe("Second collected command");
    expect(registry.catalog.category("admin")?.roots).toEqual(["settings"]);
    expect(registry.catalog.subs("settings").map(command => command.name)).toEqual(["settings prefix"]);
  });

  test("loads regex component exports", async () => {
    const loader = new ComponentLoader(resolve(import.meta.dir, "fixtures", "components"));

    await loader.load();

    expect(loader.get("customize:save")?.item.id).toBeInstanceOf(RegExp);
    expect(loader.get("customize:bad")).toBeUndefined();
  });
});
