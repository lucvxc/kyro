import { Events } from "discord.js";
import { evt } from "../../../index.ts";

const state = globalThis as typeof globalThis & { __kyroEvents?: string[] };

export default evt({
  name: Events.Warn,
  once: true,
  run: () => {
    throw new Error("test");
  },
  error: () => {
    state.__kyroEvents?.push("caught");
  },
});
