import { describe, expect, test } from "bun:test";

import { isEmbedFormat, parseEmbedFormat, parseMessageFormat } from "../bot/utils/parser.ts";

describe("bot embed parser", () => {
  test("builds Kyro embeds from the legacy format", () => {
    const parsed = parseEmbedFormat([
      "$v{embed}",
      "$v{content:Outside}",
      "$v{title:Hello}",
      "$v{description:Line\\nTwo}",
      "$v{field:Name|Value|true}",
      "$v{footer:Footer && footericon:https://example.com/footer.png}",
      "$v{timestamp}",
    ].join(""));

    expect(parsed.content).toBe("Outside");
    expect(parsed.embed.toJSON()).toMatchObject({
      title: "Hello",
      description: "Line\nTwo",
      fields: [{ name: "Name", value: "Value", inline: true }],
      footer: { text: "Footer", icon_url: "https://example.com/footer.png" },
    });
  });

  test("keeps plain messages and safely skips unresolved URLs", () => {
    expect(isEmbedFormat("hello")).toBeFalse();
    expect(parseMessageFormat("hello")).toEqual({ content: "hello" });
    expect(parseEmbedFormat("$v{embed}$v{url:{track.url}}", { allowVariableUrls: true }).embed.empty).toBeTrue();
  });
});
