import { cmd } from "./Cmd.ts";
import type { Kyro } from "../Kyro.ts";

export function reload(kyro: Kyro): ReturnType<typeof cmd> {
  return cmd({
    name: "kyro reload",
    description: "Reload Kyro files",
    aliases: ["ky reload"],
    type: "message",
    meta: { help: false },
    run: async (ctx) => {
      if (!kyro.ownerIDs.includes(ctx.author.id)) return;
      await kyro.reload();
      await ctx.reply("Kyro reloaded successfully.");
    },
  });
}
