const fs = require('fs');

// Simulate a 150x150 image where center is a small clear blob and the rest is flat white tissue
const size = 150;
const pixels = [];

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    // Distance from center
    const dist = Math.sqrt(Math.pow(x - 75, 2) + Math.pow(y - 75, 2));
    
    // Simulate a small mucus blob in the center (radius 15 out of 150).
    // The 40% crop size is 60x60, so the blob (30x30) will NOT fill the center crop.
    if (dist < 15) {
      // Small clear blob has glare (white) and shadows (dark grey)
      if (Math.random() > 0.8) {
         pixels.push({x, y, r: 255, g: 255, b: 255, l: 100}); // Glare
      } else {
         pixels.push({x, y, r: 100, g: 100, b: 100, l: 40}); // Refraction shadow
      }
    } else {
      // Flat white tissue
      const tissueL = 80 + Math.random() * 2; // 80-82 lightness (very uniform)
      pixels.push({x, y, r: 200, g: 200, b: 200, l: tissueL});
    }
  }
}

// 1. Central 40% Crop
const cropSize = Math.floor(size * 0.4); 
const startX = Math.floor((size - cropSize) / 2);
const startY = Math.floor((size - cropSize) / 2);
const endX = startX + cropSize;
const endY = startY + cropSize;

const centerPixels = pixels.filter(p => p.x >= startX && p.x < endX && p.y >= startY && p.y < endY);

console.log(`\n--- DEBUGGING KONKRET ---`);
console.log(`1. Ukuran Image Processing: ${size}x${size}`);
console.log(`2. Area Crop 40% Tengah: X(${startX} to ${endX}), Y(${startY} to ${endY})`);
console.log(`3. Total Piksel di Area Crop: ${centerPixels.length}`);
console.log(`4. Porsi Blob (Radius 15) di dalam Crop (60x60): Hanya mengisi sebagian kecil area crop (sisa area adalah tisu kosong).\n`);

// Multi-Region Variance (3x3 grid)
const regions = Array.from({length: 9}, () => []);
const regionSizeX = Math.floor(cropSize / 3);
const regionSizeY = Math.floor(cropSize / 3);

for (const p of centerPixels) {
   const gridX = Math.floor((p.x - startX) / regionSizeX);
   const gridY = Math.floor((p.y - startY) / regionSizeY);
   const validX = Math.min(2, Math.max(0, gridX));
   const validY = Math.min(2, Math.max(0, gridY));
   regions[validY * 3 + validX].push(p.l);
}

const regionStdDevs = [];
for (let i=0; i<regions.length; i++) {
  const rL = regions[i];
  const mean = rL.reduce((s, v) => s + v, 0) / rL.length;
  const variance = rL.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rL.length;
  const std = Math.sqrt(variance);
  regionStdDevs.push(std);
  console.log(`   - Region ${i} stdDevL: ${std.toFixed(2)} ${std < 1 ? '(Hamparan tisu kosong)' : '(Berisi mucus)'}`);
}

const meanStdDev = regionStdDevs.reduce((s, v) => s + v, 0) / regionStdDevs.length;
const varianceOfStdDev = regionStdDevs.reduce((s, v) => s + Math.pow(v - meanStdDev, 2), 0) / regionStdDevs.length;

// Alternative metrics
const maxStdDev = Math.max(...regionStdDevs);
const overallMean = centerPixels.reduce((s, p) => s + p.l, 0) / centerPixels.length;
const overallVariance = centerPixels.reduce((s, p) => s + Math.pow(p.l - overallMean, 2), 0) / centerPixels.length;
const overallStdDev = Math.sqrt(overallVariance);

console.log(`\n--- HASIL ACHROMATIC METRICS ---`);
console.log(`Mean of stdDevL: ${meanStdDev.toFixed(2)}`);
console.log(`Variance of stdDevL (Current Logic): ${varianceOfStdDev.toFixed(2)} --> Meleset jauh di bawah threshold Clear (> 25) karena ditarik turun oleh region tisu kosong.`);
console.log(`\n--- ALTERNATIVE METRICS UNTUK SAMPLE KECIL ---`);
console.log(`Max stdDevL across 9 regions: ${maxStdDev.toFixed(2)} --> Jauh lebih sensitif untuk menangkap area kecil (jika > 15 = Clear).`);
console.log(`Overall stdDevL of entire crop: ${overallStdDev.toFixed(2)}`);
