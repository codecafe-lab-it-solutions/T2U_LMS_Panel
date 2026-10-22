const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const publicImages = path.join(rootDir, 'public', 'images');
const coursesDir = path.join(publicImages, 'courses');
const distCoursesDir = path.join(rootDir, 'dist', 'images', 'courses');

if (!fs.existsSync(coursesDir)) {
  fs.mkdirSync(coursesDir, { recursive: true });
}
if (!fs.existsSync(distCoursesDir)) {
  fs.mkdirSync(distCoursesDir, { recursive: true });
}

// Map of target course image filename -> source image in public/images
const COURSE_IMAGE_MAPPINGS = [
  { target: 'canva-course', source: 'graphic-design.jpeg' },
  { target: 'vibe-coding', source: 'uiux.jpeg' },
  { target: 'agentic-ai', source: 'datascience.png' },
  { target: 'affiliate-marketing', source: 'selling.png' },
  { target: 'mobile-app-dev', source: 'mobileapp.jpeg' },
  { target: 'website-development', source: 'fullstack-dev.png' },
  { target: 'spoken-english', source: 'english.png' },
  { target: 'office-ready', source: 'computer-skills.png' },
  { target: 'ai-automation', source: 'ai-automatin.png' },
  { target: 'digital-marketing', source: 'digital-marketing.jpeg' },
];

async function generate() {
  console.log('Generating course images into public/images/courses and dist/images/courses...');

  for (const item of COURSE_IMAGE_MAPPINGS) {
    const srcPath = path.join(publicImages, item.source);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Source not found: ${srcPath}`);
      continue;
    }

    const pngTargetPublic = path.join(coursesDir, `${item.target}.png`);
    const webpTargetPublic = path.join(coursesDir, `${item.target}.webp`);
    const pngTargetDist = path.join(distCoursesDir, `${item.target}.png`);
    const webpTargetDist = path.join(distCoursesDir, `${item.target}.webp`);

    // Output high-quality PNG
    await sharp(srcPath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 85, compressionLevel: 8 })
      .toFile(pngTargetPublic);

    // Output high-quality WebP
    await sharp(srcPath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .toFile(webpTargetPublic);

    // Copy to dist as well
    fs.copyFileSync(pngTargetPublic, pngTargetDist);
    fs.copyFileSync(webpTargetPublic, webpTargetDist);

    console.log(`✓ Generated ${item.target}.png & ${item.target}.webp from ${item.source}`);
  }

  // Also ensure digital-marketing.png exists in public/images/
  const dmSource = path.join(publicImages, 'digital-marketing.jpeg');
  if (fs.existsSync(dmSource)) {
    const dmTargetPng = path.join(publicImages, 'digital-marketing.png');
    await sharp(dmSource).png({ quality: 85 }).toFile(dmTargetPng);
    const distImages = path.join(rootDir, 'dist', 'images');
    if (fs.existsSync(distImages)) {
      fs.copyFileSync(dmTargetPng, path.join(distImages, 'digital-marketing.png'));
    }
    console.log('✓ Generated digital-marketing.png in public/images');
  }

  console.log('All course images successfully generated!');
}

generate().catch(err => {
  console.error('Error generating course images:', err);
  process.exit(1);
});
