import { cmd } from "../../../index.ts";

export default cmd({
  name: "ping",
  description: "Replies with pong",
  run: (ctx) => ctx.reply("Pong!"),
});
