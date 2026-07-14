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
});
