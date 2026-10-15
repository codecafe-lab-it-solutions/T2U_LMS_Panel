const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function createIco(pngEntries) {
  const numImages = pngEntries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * numImages;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(numImages, 4); // count

  const dirEntries = [];
  for (const { buf, width, height } of pngEntries) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buf.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngEntries.map(p => p.buf)]);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');
  const logoPath = path.join(publicDir, 'images/logo.png');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Extract clean logo mark from logo.png (removing divider line at right)
  const { data, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true });
  for (let y = 110; y < info.height; y++) {
    for (let x = 304; x < 325; x++) {
      data[(y * info.width + x) * 4 + 3] = 0;
    }
  }

  const cleanMark = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: 32, top: 74, width: 277, height: 168 })
    .png()
    .toBuffer();

  // 2. Build 512x512 master transparent icon
  const size = 512;
  const targetW = 440;
  const targetH = Math.round(targetW * (168 / 277)); // ~267
  const targetLeft = Math.round((size - targetW) / 2); // 36
  const targetTop = Math.round((size - targetH) / 2); // 122

  const resizedMark = await sharp(cleanMark)
    .resize(targetW, targetH, { kernel: 'lanczos3' })
    .toBuffer();

  const master512 = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: resizedMark, left: targetLeft, top: targetTop }])
  .png({ quality: 100 })
  .toBuffer();

  // 3. Generate PNG sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'fav_icon.png', size: 192 }
  ];

  const generatedPngs = {};
  for (const { name, size } of sizes) {
    const buf = await sharp(master512)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ quality: 100 })
      .toBuffer();

    generatedPngs[name] = buf;
    fs.writeFileSync(path.join(publicDir, name), buf);
    console.log(`✓ Generated public/${name} (${size}x${size})`);
  }

  // 4. Multi-resolution favicon.ico
  const ico48Buf = await sharp(master512)
    .resize(48, 48, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  const icoBuf = createIco([
    { buf: generatedPngs['favicon-16x16.png'], width: 16, height: 16 },
    { buf: generatedPngs['favicon-32x32.png'], width: 32, height: 32 },
    { buf: ico48Buf, width: 48, height: 48 }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log('✓ Generated public/favicon.ico (16x16, 32x32, 48x48)');

  // 5. SVG bundle
  const b64 = master512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${b64}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ Generated public/favicon.svg');

  // 6. Sync dist/ if present
  if (fs.existsSync(distDir)) {
    for (const { name } of sizes) {
      fs.writeFileSync(path.join(distDir, name), generatedPngs[name]);
    }
    fs.writeFileSync(path.join(distDir, 'favicon.ico'), icoBuf);
    fs.writeFileSync(path.join(distDir, 'favicon.svg'), svgContent, 'utf8');
    console.log('✓ Synced all favicon files to dist/');
  }

  console.log('All favicon files updated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
