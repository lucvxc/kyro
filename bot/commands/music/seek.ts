import { cmd } from "../../../index.ts";

export default cmd({
  name: "seek",
  description: "Move to a position in the current song.",
  type: "message",
  syntax: "seek <time>",
  example: "seek 1:30",
  context: "guild",
  args: {
    time: {
      type: "string",
      required: true,
      description: "Position such as 1:30",
    },
  },
  run: async (ctx) => {
    const time = ctx.string("time")!;
    await ctx.music.seek(time);
    return ctx.reply(`Seeked to **${time}**.`);
  },
});
