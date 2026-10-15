const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function optimizeFile(filePath) {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);

  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const originalSizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  const webpPath = path.join(dir, `${base}.webp`);

  try {
    const img = sharp(filePath);
    const meta = await img.metadata();

    // Resize if unreasonably huge (e.g. > 1600px wide) while maintaining aspect ratio
    const maxWidth = 1400;
    const shouldResize = meta.width && meta.width > maxWidth;

    // 1. Generate WebP
    let webpPipeline = sharp(filePath);
    if (shouldResize) webpPipeline = webpPipeline.resize({ width: maxWidth, withoutEnlargement: true });
    await webpPipeline.webp({ quality: 82, effort: 4 }).toFile(webpPath);
    const webpStat = fs.statSync(webpPath);
    const webpSizeKb = (webpStat.size / 1024).toFixed(1);

    // 2. Compress the original PNG/JPEG in-place if it was over 1MB
    if (stat.size > 1024 * 1024) {
      const tempPath = path.join(dir, `${base}.compressed${ext}`);
      let compressPipeline = sharp(filePath);
      if (shouldResize) compressPipeline = compressPipeline.resize({ width: maxWidth, withoutEnlargement: true });

      if (ext === '.png') {
        await compressPipeline.png({ quality: 80, compressionLevel: 8 }).toFile(tempPath);
      } else {
        await compressPipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(tempPath);
      }

      const tempStat = fs.statSync(tempPath);
      if (tempStat.size < stat.size) {
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        const newSizeKb = (tempStat.size / 1024).toFixed(1);
        console.log(`⚡ ${path.basename(filePath)}: ${originalSizeMb}MB → ${newSizeKb}KB PNG & ${webpSizeKb}KB WebP`);
      } else {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.log(`✓ ${path.basename(filePath)} WebP created: ${webpSizeKb}KB`);
      }
    } else {
      console.log(`✓ ${path.basename(filePath)} WebP created: ${webpSizeKb}KB`);
    }
  } catch (err) {
    console.warn(`Failed optimizing ${filePath}:`, err.message);
  }
}

async function run() {
  const imagesDir = path.resolve(__dirname, '../public/images');
  const publicDir = path.resolve(__dirname, '../public');

  // Process public/video-lesson.png
  const videoLesson = path.join(publicDir, 'video-lesson.png');
  if (fs.existsSync(videoLesson)) await optimizeFile(videoLesson);

  // Process all files in public/images
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    for (const file of files) {
      const fullPath = path.join(imagesDir, file);
      if (fs.statSync(fullPath).isFile()) {
        await optimizeFile(fullPath);
      }
    }
  }
  console.log('✅ Image optimization pass completed.');
}

run().catch(console.error);
