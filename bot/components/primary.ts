import { cmp } from "../../index.ts";

export default cmp({
  id: "container-primary",
  async run(ctx) {
    await ctx.reply("Primary button clicked.");
  },
});
