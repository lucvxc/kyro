import { describe, expect, test } from "bun:test";

import type { Args } from "../src/commands/Arg.ts";
import { parse, type Resolvers } from "../src/commands/Parser.ts";

const resolve: Resolvers = {
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

    const parsed = parse(args, ["12.5", "yes", "a", "long", "reason"], resolve);

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
      resolve,
    );

    expect(parsed.issue).toBe('Missing required argument "user".');
  });

  test("reports invalid scalar values", () => {
    const parsed = parse(
      { enabled: { type: "boolean", required: true } },
      ["maybe"],
      resolve,
    );

    expect(parsed.issue).toBe('Invalid boolean value for "enabled".');
  });

  test("ignores arguments a message command does not use", () => {
    const parsed = parse(undefined, ["@user"], resolve);

    expect(parsed.issue).toBeUndefined();
    expect(parsed.values.size).toBe(0);
  });

  test("accepts unquoted multi-word role names", () => {
    const role = { id: "1", name: "Senior Moderators" } as never;
    const parsed = parse(
      {
        role: { type: "role", required: true },
        permission: { type: "string", required: true },
      },
      ["Senior", "Moderators", "Ban", "Members"],
      { ...resolve, role: value => value === "Senior Moderators" ? role : undefined },
    );

    expect(parsed.issue).toBeUndefined();
    expect(parsed.values.get("role")).toBe(role);
    expect(parsed.values.get("permission")).toBe("Ban Members");
  });
});
