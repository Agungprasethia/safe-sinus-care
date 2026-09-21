
export const MUCUS_COLORS = [
  {
    id: 'clear',
    label: 'Clear / Transparent',
    color: '#E0F2FE',
    textColor: '#0369A1',
    hueRange: null,
    satRange: [0, 15],
    lightRange: [80, 100],
    riskScore: 0,
    severity: 'Normal',
    description: 'Clear mucus is normal and healthy. Your sinuses are functioning properly.',
    advice: 'No action needed. Keep staying hydrated and maintain good nasal hygiene.'
  },
  {
    id: 'white',
    label: 'White / Cloudy',
    color: '#F1F5F9',
    textColor: '#475569',
    hueRange: null,
    satRange: [0, 20],
    lightRange: [60, 80],
    riskScore: 1,
    severity: 'Mild',
    description: 'White mucus indicates nasal congestion. Swollen tissue slows mucus flow, causing it to lose moisture and become thick and cloudy.',
    advice: 'Use a saline nasal spray, drink plenty of fluids, and use a humidifier.'
  },
  {
    id: 'yellow',
    label: 'Yellow',
    color: '#FEF3C7',
    textColor: '#92400E',
    hueRange: [35, 65],
    satRange: [12, 100], // Lowered from 15 to catch pale yellow
    lightRange: [30, 92], // Raised from 90 to catch bright yellow on tissue
    riskScore: 2,
    severity: 'Moderate',
    description: 'Yellow mucus suggests your immune system is actively fighting an infection. White blood cells rush to the site and produce enzymes that give mucus a yellow tint.',
    advice: 'Rest, stay hydrated, and monitor symptoms. If it persists beyond 10 days, consult a doctor.'
  },
  {
    id: 'green',
    label: 'Green',
    color: '#DCFCE7',
    textColor: '#166534',
    hueRange: [65, 170],
    satRange: [12, 100], // Lowered from 15 to catch pale green
    lightRange: [20, 90], // Raised from 85 to catch bright green on tissue
    riskScore: 3,
    severity: 'High',
    description: 'Green mucus indicates a strong immune response, often associated with a bacterial infection. The green color comes from a large concentration of dead white blood cells and bacteria.',
    advice: 'Consider consulting a doctor, especially if accompanied by fever, facial pain, or symptoms lasting more than 10 days.'
  },
  {
    id: 'brown',
    label: 'Brown / Reddish',
    color: '#FEE2E2',
    textColor: '#991B1B',
    hueRange: [0, 35],
    altHueRange: [330, 360],
    satRange: [10, 100], // Lowered from 15 to catch pale pink/blood spots washed out by tissue
    lightRange: [15, 88], // Raised from 80 to catch bright pink on tissue
    riskScore: 3,
    severity: 'High',
    description: 'Brown or reddish mucus may contain dried blood. This can result from nasal dryness, frequent nose blowing, or irritation of nasal tissue.',
    advice: 'Use a humidifier, apply saline spray, and avoid picking your nose. If bleeding persists, see a doctor.'
  },
  {
    id: 'black',
    label: 'Black / Very Dark',
    color: '#1E293B',
    textColor: '#F8FAFC',
    hueRange: null,
    satRange: [0, 100],
    lightRange: [0, 25],
    riskScore: 4,
    severity: 'Serious',
    description: 'Black mucus can be caused by heavy pollution, smoke inhalation, or in rare cases, a serious fungal infection (especially in immunocompromised individuals).',
    advice: 'Seek medical attention promptly, especially if you have a weakened immune system or no clear environmental cause.'
  }
];

export const analyzeMucusColorImage = (file, userSelectedColor = null, questionnaireData = null) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();

      const timeout = setTimeout(() => {
        reject(new Error('Image processing timed out. Please try a different image.'));
      }, 15000);

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load the image. Please try a different file.'));
      };

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 400; // Use 400x400 for processing (increased for better detail retention)
          canvas.width = size;
          canvas.height = size;
          
          // Crop the center square of the original image to prevent aspect ratio distortion
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size).data;

          // Helper to convert RGB to HSL
          const rgbToHsl = (r, g, b) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) {
              h = s = 0; // achromatic
            } else {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
              }
              h /= 6;
            }
            return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
          };

          // --- 0. Image Quality Validation ---
          let totalL = 0;
          const allPixels = [];
          
          for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const [h, s, l] = rgbToHsl(r, g, b);
            totalL += l;
            
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            allPixels.push({ x, y, r, g, b, h, s, l });
          }
          
          const avgGlobalL = totalL / (size * size);
          
          if (avgGlobalL < 15) {
             reject(new Error('Foto terlalu gelap. Silakan ambil ulang foto dengan pencahayaan yang lebih baik.'));
             return;
          }
          if (avgGlobalL > 90) {
             reject(new Error('Foto terlalu terang (overexposed). Silakan ambil ulang foto tanpa pantulan cahaya berlebih.'));
             return;
          }

          // --- 1. Precise Segmentation (Central Cropping) ---
          // Use a central area (e.g. 40% of the image size centered) to avoid tissue background
          const cropSize = Math.floor(size * 0.4); 
          const startX = Math.floor((size - cropSize) / 2);
          const startY = Math.floor((size - cropSize) / 2);
          const endX = startX + cropSize;
          const endY = startY + cropSize;

          const centerPixels = [];
          for (const p of allPixels) {
            if (p.x >= startX && p.x < endX && p.y >= startY && p.y < endY) {
              centerPixels.push(p);
            }
          }

          // --- 2. Blood Detection (Top Priority) ---
          let bloodClusterCount = 0;
          for (const p of centerPixels) {
             // Red/Brown Hue range is approx 0-35 or 330-360.
             const isRedHue = (p.h >= 0 && p.h <= 35) || (p.h >= 330 && p.h <= 360);
             if (isRedHue && p.s > 40 && p.l > 15 && p.l < 85) {
                bloodClusterCount++;
             }
          }
          
          const bloodRatio = bloodClusterCount / centerPixels.length;
          
          let potentialBloodMatch = null;
          let potentialBloodConfidence = null;

          if (bloodRatio >= 0.02) {
             if (bloodRatio > 0.50) {
                 // > 50%: Sangat mungkin latar belakang kulit yang tembus pandang.
                 // Jangan langsung vonis, simpan sebagai cadangan dengan confidence Low.
                 // Kita akan mencari sinyal warna lain (seperti variance tinggi dari glare mucus Clear).
                 potentialBloodMatch = MUCUS_COLORS.find(c => c.id === 'brown');
                 potentialBloodConfidence = 'Low';
             } else if (bloodRatio >= 0.15 && bloodRatio <= 0.50) {
                 // 15 - 50%: Kontaminasi menengah (mungkin pinggiran jari)
                 // Simpan sebagai cadangan dengan confidence Medium.
                 potentialBloodMatch = MUCUS_COLORS.find(c => c.id === 'brown');
                 potentialBloodConfidence = 'Medium';
             } else {
                 // 2 - 15%: Bercak darah spesifik di dalam lendir
                 // Ini adalah sinyal kuat darah asli, langsung return.
                 resolve({
                   detectedColor: MUCUS_COLORS.find(c => c.id === 'brown'),
                   confidence: bloodRatio >= 0.05 ? 'High' : 'Medium',
                   avgRGB: { r: 0, g: 0, b: 0 },
                   hsl: { h: 0, s: 0, l: 0 },
                   isGreyZone: false,
                   reason: 'Bercak darah atau warna merah/coklat pekat terdeteksi pada sampel.'
                 });
                 return;
             }
          }

          // --- 3. Multi-Region Variance Sampling (For Clear vs White) ---
          // Divide center crop into 3x3 grid (9 sub-regions)
          const regions = Array.from({length: 9}, () => []);
          const regionSizeX = Math.floor(cropSize / 3);
          const regionSizeY = Math.floor(cropSize / 3);
          
          let totalR = 0, totalG = 0, totalB = 0;
          
          for (const p of centerPixels) {
             // For average color calculation of the whole center
             totalR += p.r; totalG += p.g; totalB += p.b;
             
             // Map to 3x3 grid (0-8)
             const gridX = Math.floor((p.x - startX) / regionSizeX);
             const gridY = Math.floor((p.y - startY) / regionSizeY);
             // Safety bounds
             const validX = Math.min(2, Math.max(0, gridX));
             const validY = Math.min(2, Math.max(0, gridY));
             const idx = validY * 3 + validX;
             
             regions[idx].push(p.l);
          }

          // Calculate variance of stdDevL across regions
          const regionStdDevs = [];
          for (const rL of regions) {
            if (rL.length === 0) continue;
            const mean = rL.reduce((sum, val) => sum + val, 0) / rL.length;
            const variance = rL.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rL.length;
            regionStdDevs.push(Math.sqrt(variance));
          }
          
          const meanStdDev = regionStdDevs.reduce((s, v) => s + v, 0) / regionStdDevs.length;
          const varianceOfStdDev = regionStdDevs.reduce((s, v) => s + Math.pow(v - meanStdDev, 2), 0) / regionStdDevs.length;
          
          // Calculate average color of the entire central crop
          const count = centerPixels.length;
          const avgR = totalR / count;
          const avgG = totalG / count;
          const avgB = totalB / count;
          const [h, s, l] = rgbToHsl(avgR, avgG, avgB);
          
          // ==========================================
          // METRIK BARU: Specular Highlights
          // ==========================================
          let l85Count = 0;
          let l90Count = 0;
          let l95Count = 0;
          for (const p of centerPixels) {
             if (p.l >= 85) l85Count++;
             if (p.l >= 90) l90Count++;
             if (p.l >= 95) l95Count++;
          }
          const l85Ratio = (l85Count / count) * 100;
          const l90Ratio = (l90Count / count) * 100;
          const l95Ratio = (l95Count / count) * 100;

          // ==========================================
          // VISUAL CROP: Render 40% area ke Base64
          // ==========================================
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropSize;
          cropCanvas.height = cropSize;
          const cropCtx = cropCanvas.getContext('2d');
          const cropImgData = cropCtx.createImageData(cropSize, cropSize);
          let pxIdx = 0;
          for (let cy = startY; cy < endY; cy++) {
             for (let cx = startX; cx < endX; cx++) {
                const srcIdx = (cy * size + cx) * 4;
                cropImgData.data[pxIdx++] = imageData[srcIdx];
                cropImgData.data[pxIdx++] = imageData[srcIdx+1];
                cropImgData.data[pxIdx++] = imageData[srcIdx+2];
                cropImgData.data[pxIdx++] = imageData[srcIdx+3];
             }
          }
          cropCtx.putImageData(cropImgData, 0, 0);
          const base64Crop = cropCanvas.toDataURL('image/jpeg', 0.8);
          
          // ==========================================
          // DEBUGGING KONKRET (Sesuai Permintaan User)
          // ==========================================
          console.group('%c🔍 [SAFE DEBUG] Hasil Analisis Lendir', 'color: #0ea5e9; font-size: 14px; font-weight: bold;');
          console.log(`1. Ukuran Image Processing: ${size}x${size} (Setelah crop center square)`);
          console.log(`2. Area Crop 40% Tengah: X(${startX} to ${endX}), Y(${startY} to ${endY})`);
          console.log(`%c `, `font-size: 1px; padding: ${Math.min(100, cropSize/2)}px ${Math.min(100, cropSize/2)}px; background-image: url(${base64Crop}); background-size: contain; background-repeat: no-repeat; border: 2px solid red;`);
          console.log(`-> (Klik URL ini untuk melihat gambar crop penuh): ${base64Crop}`);
          console.log(`3. Rata-rata Warna Center Crop: RGB(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}) | HSL(${h}, ${s}%, ${l}%)`);
          console.log(`4. Porsi Piksel Darah (bloodRatio): ${(bloodRatio * 100).toFixed(2)}%`);
          if (potentialBloodMatch) {
             console.log(`   -> Ditahan sebagai potentialBloodMatch (Confidence: ${potentialBloodConfidence})`);
          }
          
          console.log('5. Hasil StdDevL di 9 Sub-Region (Achromatic Check):');
          const gridStr = [];
          for (let i = 0; i < 9; i += 3) {
             gridStr.push(`[ ${regionStdDevs[i].toFixed(1)} | ${regionStdDevs[i+1].toFixed(1)} | ${regionStdDevs[i+2].toFixed(1)} ]`);
          }
          console.log(gridStr.join('\n'));
          
          const maxStdDev = Math.max(...regionStdDevs);
          console.log(`6. Metrics Variance:`);
          console.log(`   - Mean of StdDevL: ${meanStdDev.toFixed(2)}`);
          console.log(`   - Variance of StdDevL: ${varianceOfStdDev.toFixed(2)} (Threshold: <15 White, >25 Clear)`);
          console.log(`   - Max StdDevL: ${maxStdDev.toFixed(2)}`);
          
          console.log(`7. Metrics Specular Highlight (Kilau Cahaya/Glare):`);
          console.log(`   - Piksel Sangat Terang (L >= 85): ${l85Count} px (${l85Ratio.toFixed(2)}%)`);
          console.log(`   - Piksel Super Terang (L >= 90): ${l90Count} px (${l90Ratio.toFixed(2)}%)`);
          console.log(`   - Piksel Silau Maksimal (L >= 95): ${l95Count} px (${l95Ratio.toFixed(2)}%)`);
          console.groupEnd();
          // ==========================================

          let matched = null;
          let isGreyZone = false;
          let confidence = 'High';

          // --- 4. Classification Gates ---
          
          // A. Black check
          if (l <= 25) {
             matched = MUCUS_COLORS.find(c => c.id === 'black');
             confidence = l < 15 ? 'High' : 'Medium';
          }
          
          // B. Hue-based (Green / Yellow) with Saturation Floor
          if (!matched) {
             // Floor minimum saturasi (s > 10) untuk menghindari noise warna pada pixel putih/abu-abu
             if (s > 10) {
                 const isGreen = h >= 65 && h <= 170;
                 const isYellow = h >= 35 && h < 65;
                 
                 if (isGreen) {
                     matched = MUCUS_COLORS.find(c => c.id === 'green');
                     confidence = s > 25 ? 'High' : 'Medium';
                 } else if (isYellow) {
                     matched = MUCUS_COLORS.find(c => c.id === 'yellow');
                     confidence = s > 25 ? 'High' : 'Medium';
                 }
             }
          }
          
          // B2. Fallback to Potential Blood (15-50% contamination)
          // Jika tidak ada warna dominan hijau/kuning yang tertangkap, dan kita punya kontaminasi darah 15-50%,
          // maka ambil hasil darah tersebut daripada menganggapnya putih/clear (karena porsinya terlalu besar untuk diabaikan).
          if (!matched && potentialBloodMatch) {
             matched = potentialBloodMatch;
             confidence = potentialBloodConfidence;
          }
          
          // C. Achromatic Check (White vs Clear) based on variance
          if (!matched) {
             let achromaticMatch = null;
             let achromaticConfidence = 'Low';
             let isClearSignal = false;
             
             // White mucus is generally opaque, producing uniform regions (lower varianceOfStdDev).
             // Clear mucus allows background to show through unevenly, or has strong specular highlights (higher varianceOfStdDev).
             if (varianceOfStdDev > 25) {
                 // High variance between regions -> uneven -> Clear (Sinyal jelas)
                 achromaticMatch = MUCUS_COLORS.find(c => c.id === 'clear');
                 achromaticConfidence = varianceOfStdDev > 40 ? 'Medium' : 'Low';
                 isClearSignal = true;
             } else if (varianceOfStdDev < 15) {
                 // Low variance between regions -> opaque uniform -> White (Sinyal jelas)
                 achromaticMatch = MUCUS_COLORS.find(c => c.id === 'white');
                 achromaticConfidence = varianceOfStdDev < 8 ? 'High' : 'Medium';
                 isClearSignal = true;
             } else {
                 // 15 - 25 is ambiguous (Tidak ada sinyal jelas)
                 // Default fallback untuk area abu-abu ini
                 achromaticMatch = MUCUS_COLORS.find(c => c.id === 'clear');
                 achromaticConfidence = 'Low';
                 isClearSignal = false;
             }
             
             // Cek Grey Area user selection
             if (varianceOfStdDev >= 15 && varianceOfStdDev <= 25) {
                 if (userSelectedColor && (userSelectedColor.id === 'clear' || userSelectedColor.id === 'white')) {
                     achromaticMatch = MUCUS_COLORS.find(c => c.id === userSelectedColor.id);
                     isGreyZone = true;
                     isClearSignal = true; // User manual selection makes it a clear signal
                 }
             }
             
             // D. Fallback Chain:
             // Jika ada potensi darah (15-50% kontaminasi) dan achromatic TIDAK memberikan sinyal jelas,
             // gunakan potensi darah tersebut. Jika achromatic punya sinyal jelas, gunakan achromatic.
             if (potentialBloodMatch && !isClearSignal) {
                 matched = potentialBloodMatch;
                 confidence = potentialBloodConfidence;
             } else {
                 matched = achromaticMatch;
                 confidence = achromaticConfidence;
             }
          }

          if (!matched) {
            matched = {
              id: 'unknown',
              label: 'Unclear Detection',
              color: '#E2E8F0',
              textColor: '#475569',
              riskScore: 0,
              severity: 'Unknown',
              description: 'Warna tidak dapat dideteksi dengan jelas dari foto. Pencahayaan, bayangan, atau latar belakang mungkin memengaruhi hasil.',
              advice: 'Silakan ambil ulang foto dengan pencahayaan yang lebih baik, di atas tisu putih polos.'
            };
            confidence = 'Low';
          }

          resolve({
            detectedColor: matched,
            confidence,
            avgRGB: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
            hsl: { h, s, l },
            isGreyZone
          });
        } catch (err) {
          reject(new Error('Gagal memproses data gambar. Silakan coba lagi.'));
        }
      };
      img.src = URL.createObjectURL(file);
    } catch (err) {
      reject(new Error('Terjadi kesalahan tak terduga. Silakan coba lagi.'));
    }
  });
};

