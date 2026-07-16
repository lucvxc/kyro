import { cmd } from "../../../../index.ts";

export default cmd({
  name: "settings prefix",
  description: "Change the command prefix",
  args: { prefix: { type: "string", description: "The new prefix", required: true } },
  run: () => undefined,
});
