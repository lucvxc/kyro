import { cmd } from "../../index.ts";

export default cmd({
  name: "test",
  description: "Test the command system",
  type: "hybrid",
  context: "dms",
  aliases: ["t"],
  args: {
    text: {
      type: "string",
      description: "Text for the bot to repeat",
    },
  },
  run: (ctx) => {
    const text = ctx.string("text") ?? `Everything works, ${ctx.author.username}.`;
    return ctx.reply(text);
  },
});
