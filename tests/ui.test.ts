import { describe, expect, test } from "bun:test";

import { MessageFlags } from "discord.js";
import {
  button,
  codes,
  compact,
  container,
  embed,
  fill,
  groups,
  mention,
  messageOptions,
  select,
  thumb,
  time,
  unix,
} from "../index.ts";

describe("Time", () => {
  test("formats dates, milliseconds, and Discord seconds", () => {
    expect(time(new Date(1_000), "R")).toBe("<t:1:R>");
    expect(time(1_000)).toBe("<t:1000:F>");
    expect(time(12_000_000_000)).toBe("<t:12000000:F>");
    expect(unix(new Date(1_000))).toBe(1);
  });
});

describe("Text", () => {
  test("formats counts and fills cached template variables", () => {
    expect(compact(1_200)).toBe("1.2k");
    expect(compact(1_000_000)).toBe("1m");
    expect(fill("Hello {user}, {USER}!", { "{user}": "Kyro" })).toBe(
      "Hello Kyro, Kyro!",
    );
    expect(codes(["Ban Members", "Kick Members"])).toBe(
      "`Ban Members` · `Kick Members`",
    );
    expect(
      groups(
        ["a:1", "a:2", "b:3"],
        (value) => value[0],
        (key, values) => `${key}:${values.length}`,
      ),
    ).toBe("a:2\n\nb:1");
    expect(mention.role("123")).toBe("<@&123>");
  });
});

describe("Embed", () => {
  test("builds complete embeds from clean options", () => {
    expect(
      embed({
        title: "Saved",
        description: "Your settings were updated.",
        color: "#57F287",
        footer: "Kyro",
        timestamp: true,
      }).toJSON(),
    ).toMatchObject({
      title: "Saved",
      description: "Your settings were updated.",
      color: 0x57f287,
      footer: { text: "Kyro" },
    });
  });

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
    expect(() =>
      button({ id: "bad", style: "link", url: "https://example.com" }),
    ).toThrow("Link buttons use url instead of id.");
    expect(() => button({ style: "link" })).toThrow(
      "Link buttons require a url.",
    );
    expect(() => button({ label: "Bad" })).toThrow(
      "Interactive buttons require an id.",
    );
  });

  test("uses text when a section has no accessory", () => {
    const value = container().section("No accessory").toJSON();

    expect(value.components).toHaveLength(1);
    expect(value.components[0]).toMatchObject({ content: "No accessory" });
  });
});

describe("Message", () => {
  test("serializes framework UI consistently", () => {
    expect(messageOptions("hello")).toMatchObject({
      content: "hello",
      allowedMentions: { parse: [] },
    });
    expect(messageOptions(embed().desc("hello"))).toMatchObject({
      embeds: [{ description: "hello" }],
    });
    expect(messageOptions(container().text("hello"), true)).toMatchObject({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [{ components: [{ content: "hello" }] }],
    });
  });
});
