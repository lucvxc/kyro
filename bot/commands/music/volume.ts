import { cmd } from "../../../index.ts";

export default cmd({
  name: "volume",
  description: "Set the music volume.",
  type: "message",
  aliases: ["vol"],
  syntax: "volume <level>",
  example: "volume 75",
  context: "guild",
  args: {
    level: {
      type: "number",
      required: true,
      description: "Volume from 0 to 200",
    },
  },
  run: async (ctx) => {
    const level = ctx.number("level")!;
    await ctx.music.volume(level);
    return ctx.reply(`Set the volume to **${level}%**.`);
  },
});
