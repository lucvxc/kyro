import { image, top, type Album, type Period } from "./client.ts";

let loader: Promise<typeof import("sharp").default> | undefined;

export async function chart(user: string, size: number, period: Period) {
  const sharp = await (loader ??= import("sharp").then(
    (module) => module.default,
  ));
  const albums = (await top(user, "albums", period, size * size)) as Album[];
  const tiles = await Promise.all(
    albums.map(async (album, index) => {
      const url = image(album.image);
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      const input = Buffer.from(await res.arrayBuffer());
      return {
        input: await sharp(input)
          .resize(300, 300, { fit: "cover" })
          .png()
          .toBuffer(),
        left: (index % size) * 300,
        top: Math.floor(index / size) * 300,
      };
    }),
  );
  return sharp({
    create: {
      width: size * 300,
      height: size * 300,
      channels: 4,
      background: "#111111",
    },
  })
    .composite(tiles.filter((item) => item !== null))
    .png()
    .toBuffer();
}
