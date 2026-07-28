import { describe, expect, test } from "bun:test";

import { rows, style } from "../bot/features/roles/buttonpanels.ts";
import type { ButtonRolePanel } from "../bot/db/settings.ts";

describe("button role panels", () => {
  test("normalizes friendly button colors", () => {
    expect(style("grey")).toBe("secondary");
    expect(style("blue")).toBe("primary");
    expect(style("green")).toBe("success");
    expect(style("red")).toBe("danger");
  });

  test("renders roles in rows of five", () => {
    const panel: ButtonRolePanel = {
      id: "12345678",
      name: "colors",
      title: "Choose a color",
      accent: "#5865F2",
      mode: "toggle",
      roles: Array.from({ length: 6 }, (_, index) => ({
        roleId: String(10000000000000000n + BigInt(index)),
        label: `Role ${index + 1}`,
        style: "secondary",
      })),
    };

    const value = rows(panel);
    expect(value).toHaveLength(2);
    expect(value[0]?.toJSON().components).toHaveLength(5);
    expect(value[1]?.toJSON().components).toHaveLength(1);
  });
});
