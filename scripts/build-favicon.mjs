import fs from "node:fs";
import sharp from "sharp";

const src = fs.readFileSync("public/brand/icon-x.svg", "utf8");
const inner = src
  .replace(/<\?xml[^>]*>/, "")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="560 140 950 950">
  <rect x="560" y="140" width="950" height="950" rx="180" fill="#0B0D12"/>
  ${inner}
</svg>`;

function ico(images) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    const dim = img.size >= 256 ? 0 : img.size;
    entry.writeUInt8(dim, 0);
    entry.writeUInt8(dim, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.png.length;
  }
  return Buffer.concat([dir, ...entries, ...images.map((img) => img.png)]);
}

const sizes = [16, 32, 48, 256];
const images = [];
for (const size of sizes) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  images.push({ size, png });
}

const icon = ico(images);
// Next.js serves src/app/favicon.ico ahead of public/favicon.ico.
fs.writeFileSync("src/app/favicon.ico", icon);
fs.writeFileSync("public/favicon.ico", icon);
fs.writeFileSync(
  "public/favicon-32.png",
  await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer(),
);
fs.writeFileSync(
  "public/apple-touch-icon.png",
  await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer(),
);

console.log("favicon ready");
