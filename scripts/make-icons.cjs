const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const input = path.resolve('.\public\brand\gg-mark.svg');
const out192 = path.resolve('public/icon-192.png');
const out512 = path.resolve('public/icon-512.png');
const apple = path.resolve('public/apple-touch-icon.png');

async function makeMaskable(size, outPath){
  const pad = Math.round(size * 0.12);           // safe maskable padding
  const inner = size - pad * 2;
  let img = sharp(input, { density: 1024 })
    .resize(inner, inner, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r:0,g:0,b:0,alpha:0 }});
  await img.toFile(outPath);
  console.log('✓', path.basename(outPath));
}

async function makeApple(){
  // Solid background recommended for iOS. Logo ~140 with 20px padding = 180 total.
  await sharp(input, { density: 1024 })
    .resize(140, 140, { fit: 'contain' })
    .png()
    .flatten({ background: '#0B1220' })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#0B1220' })
    .toFile(apple);
  console.log('✓', path.basename(apple));
}

(async () => {
  await makeMaskable(192, out192);
  await makeMaskable(512, out512);
  await makeApple();
})();