import { cmp } from "../../index.ts";

export default cmp({
  id: "container-confirm",
  async run(ctx) {
    await ctx.reply("Confirmed- the button interaction works.");
  },
});
