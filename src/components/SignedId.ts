import { createHmac, timingSafeEqual } from "node:crypto";

export class ComponentSigner {
  public constructor(
    private readonly secret: string,
    private readonly signatureLength = 12,
  ) {
    if (secret.length < 16)
      throw new TypeError(
        "Component signing secrets must contain at least 16 characters.",
      );
  }

  public sign(id: string): string {
    const signature = this.#signature(id);
    const value = `${id}.${signature}`;
    if (value.length > 100)
      throw new RangeError(
        "Signed component IDs cannot exceed 100 characters.",
      );
    return value;
  }

  public verify(value: string): string | null {
    const index = value.lastIndexOf(".");
    if (index < 1) return null;
    const id = value.slice(0, index);
    const actual = Buffer.from(value.slice(index + 1));
    const expected = Buffer.from(this.#signature(id));
    return actual.length === expected.length &&
      timingSafeEqual(actual, expected)
      ? id
      : null;
  }

  #signature(id: string): string {
    return createHmac("sha256", this.secret)
      .update(id)
      .digest("base64url")
      .slice(0, this.signatureLength);
  }
}
