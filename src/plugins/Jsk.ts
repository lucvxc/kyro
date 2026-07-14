import { cmd } from "../commands/Cmd.ts";
import { plugin } from "./Plugin.ts";

export const jsk = plugin({
  name: "jishaku",
  version: "0.1.0",
  setup(kyro) {
    kyro.command(cmd({
      name: "jsk",
      description: "Kyro developer tools",
      type: "hybrid",
      run: (ctx) => ctx.reply("Jishaku tools are coming soon."),
    }));
  },
});
