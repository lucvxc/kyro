import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scan } from "../src/core/Files.ts";

describe("framework boundary", () => {
  test("does not depend on or publish the example bot", async () => {
    const files = await scan(resolve("src"));

    for (const file of files) {
      const source = await readFile(file, "utf8");
      expect(source).not.toMatch(/(?:from\s+|import\s*\()["'][^"']*\/bot\//);
    }

    const pkg = JSON.parse(await readFile(resolve("package.json"), "utf8")) as { files?: string[] };
    expect(pkg.files).not.toContain("bot");
  });
});
