import { cmd, embed } from "../../index.ts";

export default cmd({
  name: "embed-test",
  description: "Show every Embed builder feature",
  type: "hybrid",
  aliases: ["embed"],
  run: (ctx) => {
    const card = embed()
      .title("Kyro Embed Builder")
      .desc("This embed uses Kyro's clean wrapper around discord.js.")
      .color("#5865F2")
      .url("https://discord.js.org")
      .author({
        name: "Kyro Framework",
        icon: "https://cdn.discordapp.com/embed/avatars/0.png",
        url: "https://discord.js.org",
      })
      .thumb("https://cdn.discordapp.com/embed/avatars/1.png")
      .image("https://cdn.discordapp.com/embed/avatars/2.png")
      .field("Inline field", "This field is inline.", true)
      .field("Another field", "This one is inline too.", true)
      .fields({ name: "Full-width field", value: "This field uses the full width." })
      .footer({
        text: "Built with Kyro",
        icon: "https://cdn.discordapp.com/embed/avatars/3.png",
      })
      .time();

    return ctx.reply(card);
  },
});
