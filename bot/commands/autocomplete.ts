import { cmd } from "../../index.ts";

const colors = ["red", "orange", "yellow", "green", "blue", "purple"];

export default cmd({
  name: "autocomplete-test",
  description: "Test command autocomplete",
  type: "slash",
  args: {
    color: { type: "string", description: "Choose a color", required: true, autocomplete: true },
  },
  autocomplete: (ctx) => colors
    .filter(color => color.startsWith(ctx.value.toLowerCase()))
    .map(color => ({ name: color, value: color })),
  run: (ctx) => ctx.reply(`You chose ${ctx.string("color")}.`),
});
