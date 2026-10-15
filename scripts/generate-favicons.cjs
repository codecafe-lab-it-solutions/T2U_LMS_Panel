const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12031e"/>
      <stop offset="50%" stop-color="#230a3b"/>
      <stop offset="100%" stop-color="#0a0112"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7a00"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <linearGradient id="violetGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#ff7a00" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Squircle with Border -->
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#bgGrad)" stroke="#8b5cf6" stroke-width="8" stroke-opacity="0.4"/>

  <!-- Subtle Inner Ring -->
  <rect x="36" y="36" width="440" height="440" rx="100" fill="none" stroke="url(#violetGrad)" stroke-width="2" stroke-opacity="0.25"/>

  <!-- T2U Symbol Monogram -->
  <g filter="url(#glow)">
    <!-- Upward Growth Arrow (Upgrade) -->
    <path d="M 256 100 L 376 220 L 320 220 L 320 310 L 192 310 L 192 220 L 136 220 Z" fill="url(#accentGrad)"/>

    <!-- T2U Text Beneath Arrow -->
    <text x="256" y="415" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="94" letter-spacing="4" fill="#ffffff">
      T2U
    </text>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // 1. Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ Generated public/favicon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate PNG sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ quality: 95 })
      .toFile(path.join(publicDir, name));
    console.log(`✓ Generated public/${name} (${size}x${size})`);
  }

  // Generate favicon.ico from 32x32 png
  const png32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32Buffer);
  console.log('✓ Generated public/favicon.ico');

  // Also update high-res fav_icon.png
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'fav_icon.png'));
  console.log('✓ Updated public/fav_icon.png to 192x192 high-resolution');

  // 3. Generate site.webmanifest
  const manifest = {
    name: "T2U — Time to Upgrade",
    short_name: "T2U",
    description: "India's all-in-one learn, upgrade, and earn platform.",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#12031e",
    background_color: "#12031e",
    display: "standalone",
    start_url: "/"
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Generated public/site.webmanifest');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
