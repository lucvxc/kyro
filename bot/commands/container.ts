import { button, cmd, container, select, thumb } from "../../index.ts";

export default cmd({
  name: "container-test",
  description: "Show every Components V2 builder feature",
  type: "hybrid",
  aliases: ["container", "cv2"],
  run: (ctx) => {
    const card = container()
      .accent("#57F287")
      .text("# Kyro Components V2\nThis is a text display component.")
      .separator()
      .section(
        "This section has a button accessory.",
        button({ id: "container-confirm", label: "Confirm", style: "success" }),
      )
      .section(
        "This section has a thumbnail accessory.",
        thumb("https://cdn.discordapp.com/embed/avatars/4.png"),
      )
      .gallery(
        {
          url: "https://cdn.discordapp.com/embed/avatars/5.png",
          description: "First gallery image",
        },
        {
          url: "https://cdn.discordapp.com/embed/avatars/0.png",
          description: "Second gallery image",
        },
      )
      .file("README.md", "kyro-readme.md")
      .row(
        button({ id: "container-primary", label: "Primary", style: "primary" }),
        button({ label: "Discord.js", style: "link", url: "https://discord.js.org" }),
      )
      .row(
        select({
          id: "container-select",
          placeholder: "Choose a value",
          options: [
            { label: "One", value: "one", description: "The first value" },
            { label: "Two", value: "two", description: "The second value" },
          ],
        }),
      );

    return ctx.reply(card);
  },
});
