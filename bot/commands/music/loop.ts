import { cmd, type Loop } from "../../../index.ts";

export default cmd({
  name: "loop",
  description: "Change the queue loop mode.",
  type: "message",
  syntax: "loop <mode>",
  example: "loop track",
  context: "guild",
  args: {
    mode: {
      type: "string",
      required: true,
      description: "Loop mode",
      choices: [
        { name: "Off", value: "off" },
        { name: "Track", value: "track" },
        { name: "Queue", value: "queue" },
      ],
    },
  },
  run: (ctx) => {
    const mode = ctx.string("mode")! as Loop;
    ctx.music.loop(mode);
    return ctx.reply(`Looping is now set to **${mode}**.`);
  },
});
