/* eslint-disable no-console */
import sharp from 'sharp';
import fs from 'fs';

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

async function renderPng(svgPath, pngPath, size) {
  console.log(`Rendering ${pngPath} from ${svgPath} @ ${size}x${size}`);
  const svg = await fs.promises.readFile(svgPath);
  const buffer = await sharp(svg).resize(size, size, { fit: 'contain', background: { r: 17, g: 24, b: 39, alpha: 1 } }).png().toBuffer();
  await fs.promises.writeFile(pngPath, buffer);
  console.log(`✔ Wrote ${pngPath}`);
}

async function main() {
  await ensureDir('resources');
  const iconSvg = 'resources/icon.svg';
  const splashSvg = 'resources/splash.svg';
  const iconPng = 'resources/icon.png';
  const splashPng = 'resources/splash.png';

  // icon: 1024x1024, splash: 2732x2732
  if (fs.existsSync(iconSvg)) {
    await renderPng(iconSvg, iconPng, 1024);
  } else {
    console.warn('⚠ icon.svg not found in resources/');
  }
  if (fs.existsSync(splashSvg)) {
    await renderPng(splashSvg, splashPng, 2732);
  } else {
    console.warn('⚠ splash.svg not found in resources/');
  }
}

main().catch((e) => {
  console.error('Render assets failed:', e);
  process.exit(1);
});

