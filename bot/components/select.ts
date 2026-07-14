import { cmp } from "../../index.ts";

export default cmp({
  id: "container-select",
  async run(ctx) {
    await ctx.reply(`Selected ${ctx.values.join(", ") || "nothing"}`);
  },
});
