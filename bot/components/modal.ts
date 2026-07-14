import { cmp } from "../../index.ts";

export default cmp({
  id: "modal-test",
  async run(ctx) {
    await ctx.reply(`Hello ${ctx.field("name") ?? "there"}! You wrote: ${ctx.field("message") ?? "nothing"}`);
  },
});
