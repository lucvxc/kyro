import { cmd } from "../../../index.ts";

export default [
  cmd({
    name: "alpha",
    description: "First collected command",
    run: () => undefined,
  }),
  cmd({
    name: "beta",
    description: "Second collected command",
    run: () => undefined,
  }),
];
