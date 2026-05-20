/**
 * Batch photo compressor for the loading screen slideshow.
 *
 * Default (rebuild all):
 *   npm run photos
 *   Compresses all files in public/photos/raw/ → 01.jpg, 02.jpg, …
 *   WARNING: overwrites existing compressed photos.
 *
 * Append mode (add new photos without touching existing ones):
 *   npm run photos -- --append
 *   Detects the highest existing NN.jpg in public/photos/ and starts
 *   numbering new files from there. Safe to run repeatedly.
 *   After running, add the printed entries to the bottom of src/lib/photos.ts.
 *
 * Settings: 700px wide, MozJPEG quality 75 — matches Squoosh recommended settings.
 * Portrait photos are resized to 700px tall instead, keeping aspect ratio.
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_DIR = path.join(__dirname, '../public/photos/raw')
const OUT_DIR = path.join(__dirname, '../public/photos')

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'])
const append = process.argv.includes('--append')

// In append mode, find the highest existing NN.jpg to start numbering after it
let startIdx = 0
if (append) {
  const existing = fs.readdirSync(OUT_DIR)
    .map(f => parseInt(path.basename(f, '.jpg'), 10))
    .filter(n => !isNaN(n))
  startIdx = existing.length > 0 ? Math.max(...existing) : 0
  console.log(`Append mode: existing photos go up to ${String(startIdx).padStart(2, '0')}.jpg. New photos will start at ${String(startIdx + 1).padStart(2, '0')}.jpg.\n`)
}

const files = fs
  .readdirSync(RAW_DIR)
  .filter(f => SUPPORTED.has(path.extname(f).toLowerCase()))
  .sort()

if (files.length === 0) {
  console.log('No images found in public/photos/raw/ — add your photos and try again.')
  process.exit(0)
}

console.log(`Found ${files.length} image(s). Processing...\n`)

const results = []
let errors = 0

for (let i = 0; i < files.length; i++) {
  const input = path.join(RAW_DIR, files[i])
  const num = String(startIdx + i + 1).padStart(2, '0')
  const output = path.join(OUT_DIR, `${num}.jpg`)

  try {
    const image = sharp(input)
    const meta = await image.metadata()
    const isPortrait = (meta.height ?? 0) > (meta.width ?? 0)

    await image
      .rotate() // auto-rotate based on EXIF orientation (fixes Pixel photos)
      .resize(
        isPortrait ? null : 700,   // landscape: fix width
        isPortrait ? 700 : null,   // portrait:  fix height
        { withoutEnlargement: true }
      )
      .jpeg({ quality: 75, mozjpeg: true })
      .toFile(output)

    const inKB  = Math.round(fs.statSync(input).size  / 1024)
    const outKB = Math.round(fs.statSync(output).size / 1024)
    const saved = Math.round((1 - outKB / inKB) * 100)

    console.log(`  [${num}] ${files[i].padEnd(40)} ${inKB}KB → ${outKB}KB  (${saved}% smaller)`)
    results.push(`  { src: '/photos/${num}.jpg', pos: 'top' },`)
  } catch (err) {
    console.error(`  [${num}] ERROR processing ${files[i]}: ${err.message}`)
    errors++
  }
}

console.log(`\n✓ Done. ${files.length - errors} compressed, ${errors} error(s).`)
console.log('\nAppend these entries to the PHOTOS array in src/lib/photos.ts:\n')
results.forEach(r => console.log(r))
