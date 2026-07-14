import { describe, expect, test } from "bun:test";

import { button, container, embed, select, thumb } from "../index.ts";

describe("Embed", () => {
  test("supports the clean builder API and hex colors", () => {
    const value = embed()
      .title("Title")
      .desc("Description")
      .color("#5865F2")
      .author("Kyro")
      .footer("Footer")
      .field("Name", "Value", true)
      .time()
      .toJSON();

    expect(value).toMatchObject({
      title: "Title",
      description: "Description",
      color: 0x5865f2,
      author: { name: "Kyro" },
      footer: { text: "Footer" },
    });
  });
});

describe("Container", () => {
  test("builds Components V2 content and controls", () => {
    const value = container()
      .accent("#57F287")
      .text("Hello")
      .separator()
      .section("Button", button({ id: "button", label: "Click" }))
      .section("Thumbnail", thumb("https://example.com/image.png"))
      .gallery("https://example.com/image.png")
      .file("README.md", "readme.md")
      .row(
        button({ id: "one", label: "One" }),
        select({
          id: "select",
          options: [{ label: "One", value: "one" }],
        }),
      )
      .toJSON();

    expect(value.accent_color).toBe(0x57f287);
    expect(value.components.length).toBe(7);
  });

  test("keeps link and interactive buttons separate", () => {
    expect(() => button({ id: "bad", style: "link", url: "https://example.com" })).toThrow(
      "Link buttons use url instead of id.",
    );
    expect(() => button({ style: "link" })).toThrow("Link buttons require a url.");
    expect(() => button({ label: "Bad" })).toThrow("Interactive buttons require an id.");
  });
});
