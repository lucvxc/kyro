import { Events } from "discord.js";
import { evt } from "../../../index.ts";

const state = globalThis as typeof globalThis & { __kyroEvents?: string[] };

export default evt({
  name: Events.Debug,
  priority: -1,
  when: (message) => message === "run",
  run: () => {
    state.__kyroEvents?.push("low");
  },
});
