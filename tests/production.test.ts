import { describe, expect, test } from "bun:test";
import { compileSlash } from "../src/commands/Compiler.ts";
import { Registry } from "../src/commands/Registry.ts";
import { cmd } from "../src/commands/Cmd.ts";
import { modal } from "../src/ui/Control.ts";

describe("production APIs", () => {
  test("compiles autocomplete options and choices", () => {
    const registry = new Registry().add(
      cmd({
        name: "search",
        description: "Search",
        type: "slash",
        args: { query: { type: "string", required: true, autocomplete: true } },
        run: () => undefined,
      }),
    );
    const option = compileSlash(registry.values())[0]!.options![0] as {
      autocomplete?: boolean;
    };
    expect(option.autocomplete).toBe(true);
  });

  test("builds modal inputs", () => {
    const value = modal({
      id: "profile",
      title: "Profile",
      inputs: [{ id: "name", label: "Name" }],
    }).toJSON();
    expect(value.custom_id).toBe("profile");
    expect(value.components).toHaveLength(1);
  });

  test("builds modern modal selects and file uploads", () => {
    const value = modal({
      id: "customize",
      title: "Customize",
      inputs: [
        {
          type: "file",
          id: "avatar",
          label: "Avatar",
          required: false,
          max: 1,
        },
        {
          type: "string",
          id: "style",
          label: "Style",
          required: false,
          min: 0,
          options: [{ label: "Glow", value: "glow" }],
        },
      ],
    }).toJSON();

    expect(value.components[0]).toMatchObject({
      type: 18,
      component: { type: 19, custom_id: "avatar" },
    });
    expect(value.components[1]).toMatchObject({
      type: 18,
      component: { type: 3, custom_id: "style" },
    });
  });
});
