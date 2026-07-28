import { describe, expect, test } from "bun:test";

import type { Args } from "../src/commands/Arg.ts";
import { parse, type ArgLookups } from "../src/commands/Parser.ts";

const lookup: ArgLookups = {
  user: () => undefined,
  role: () => undefined,
  channel: () => undefined,
};

describe("parse", () => {
  test("parses numbers, booleans, and a trailing string", () => {
    const args: Args = {
      amount: { type: "number", required: true },
      enabled: { type: "boolean", required: true },
      reason: { type: "string" },
    };

    const parsed = parse(args, ["12.5", "yes", "a", "long", "reason"], lookup);

    expect(parsed.issue).toBeUndefined();
    expect(Object.fromEntries(parsed.values)).toEqual({
      amount: 12.5,
      enabled: true,
      reason: "a long reason",
    });
  });

  test("reports missing required arguments", () => {
    const parsed = parse(
      { user: { type: "user", required: true } },
      [],
      lookup,
    );

    expect(parsed.issue).toBe('Missing required argument "user".');
  });

  test("reports invalid scalar values", () => {
    const parsed = parse(
      { enabled: { type: "boolean", required: true } },
      ["maybe"],
      lookup,
    );

    expect(parsed.issue).toBe('Invalid boolean value for "enabled".');
  });

  test("ignores arguments a message command does not use", () => {
    const parsed = parse(undefined, ["@user"], lookup);

    expect(parsed.issue).toBeUndefined();
    expect(parsed.values.size).toBe(0);
  });

  test("applies defaults to omitted message arguments", () => {
    const parsed = parse(
      {
        panel: { type: "string", default: "dropdown" },
        limit: { type: "number", default: 0 },
        enabled: { type: "boolean", default: true },
      },
      [],
      lookup,
    );

    expect(Object.fromEntries(parsed.values)).toEqual({
      panel: "dropdown",
      limit: 0,
      enabled: true,
    });
  });

  test("accepts unquoted multi-word role names", () => {
    const role = { id: "1", name: "Senior Moderators" } as never;
    const parsed = parse(
      {
        role: { type: "role", required: true },
        permission: { type: "string", required: true },
      },
      ["Senior", "Moderators", "Ban", "Members"],
      {
        ...lookup,
        role: (value) => (value === "Senior Moderators" ? role : undefined),
      },
    );

    expect(parsed.issue).toBeUndefined();
    expect(parsed.values.get("role")).toBe(role);
    expect(parsed.values.get("permission")).toBe("Ban Members");
  });
});
