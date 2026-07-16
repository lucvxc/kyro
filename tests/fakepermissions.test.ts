import { describe, expect, test } from "bun:test";

import { permissionChoices, permissionName } from "../bot/utils/fakepermissions.ts";

describe("fake permissions", () => {
  test("normalizes readable Discord permission names", () => {
    expect(permissionName("Manage Messages")).toBe("ManageMessages");
    expect(permissionName("ban_members")).toBe("BanMembers");
  });

  test("rejects unknown permissions and filters autocomplete", () => {
    expect(() => permissionName("MakeEveryoneCool")).toThrow("not a valid Discord permission");
    expect(permissionChoices("manage message")).toContainEqual({
      name: "Manage Messages",
      value: "ManageMessages",
    });
  });
});
