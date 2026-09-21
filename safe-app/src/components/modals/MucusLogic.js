
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
          const size = 150; // Increased resolution for better precision
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size).data;

          // --- 1. Global Scan & Find Background Baseline (White Balance) ---
          let allPixels = [];
          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              const i = (y * size + x) * 4;
              const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
              const max = Math.max(r, g, b) / 255;
              const min = Math.min(r, g, b) / 255;
              const l = (max + min) / 2;
              
              // Only process center 80% to ignore extreme edges
              if (x > size * 0.1 && x < size * 0.9 && y > size * 0.1 && y < size * 0.9) {
                allPixels.push({ x, y, r, g, b, l });
              }
            }
          }

          // Sort by lightness to find the background (top 15% brightest, excluding top 1% glare)
          allPixels.sort((a, b) => b.l - a.l);
          const backgroundPixels = allPixels.slice(
            Math.floor(allPixels.length * 0.01), 
            Math.floor(allPixels.length * 0.15)
          );
          
          let tR = 0, tG = 0, tB = 0;
          backgroundPixels.forEach(p => { tR += p.r; tG += p.g; tB += p.b; });
          const bgRGB = { 
            r: tR / backgroundPixels.length, 
            g: tG / backgroundPixels.length, 
            b: tB / backgroundPixels.length 
          };

          // --- 2. Foreground Extraction (Find the actual mucus) ---
          let opaqueR = 0, opaqueG = 0, opaqueB = 0;
          let opaqueCount = 0;
          let specularCount = 0;
          
          let centerR = 0, centerG = 0, centerB = 0; // Fallback
          let centerCount = 0;

          for (const p of allPixels) {
            const dx = p.x - (size / 2);
            const dy = p.y - (size / 2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Distance from background color
            const colorDist = Math.sqrt(
              Math.pow(p.r - bgRGB.r, 2) + 
              Math.pow(p.g - bgRGB.g, 2) + 
              Math.pow(p.b - bgRGB.b, 2)
            );

            // Specular/Glare: Very bright pixels
            const isSpecular = p.r > 220 && p.g > 220 && p.b > 220;
            
            // Opaque Substance: Deviates from background color AND is not just white glare
            const isOpaque = colorDist > 35 && !isSpecular;

            if (isSpecular) specularCount++;
            
            if (isOpaque) {
              opaqueCount++;
              opaqueR += p.r;
              opaqueG += p.g;
              opaqueB += p.b;
            }

            if (dist < size * 0.4) {
              centerR += p.r; centerG += p.g; centerB += p.b;
              centerCount++;
            }
          }

          const totalPixels = allPixels.length;
          const specularPct = (specularCount / totalPixels) * 100;
          const opaquePct = (opaqueCount / totalPixels) * 100;

          // Determine the dominant color of the SUBSTANCE (not the background)
          const useOpaqueColor = opaquePct > 8; // If at least 8% of the image is a distinct substance
          const avgR = useOpaqueColor ? (opaqueR / opaqueCount) : (centerR / centerCount);
          const avgG = useOpaqueColor ? (opaqueG / opaqueCount) : (centerG / centerCount);
          const avgB = useOpaqueColor ? (opaqueB / opaqueCount) : (centerB / centerCount);

          const rAvg = avgR / 255, gAvg = avgG / 255, bAvg = avgB / 255;
          const max = Math.max(rAvg, gAvg, bAvg), min = Math.min(rAvg, gAvg, bAvg);
          let h = 0, s = 0, l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rAvg: h = ((gAvg - bAvg) / d + (gAvg < bAvg ? 6 : 0)) / 6; break;
              case gAvg: h = ((bAvg - rAvg) / d + 2) / 6; break;
              case bAvg: h = ((rAvg - gAvg) / d + 4) / 6; break;
              default: break;
            }
          }
          h = Math.round(h * 360);
          s = Math.round(s * 100);
          l = Math.round(l * 100);

          console.log(`[MucusScan v8.1] BG: [${Math.round(bgRGB.r)},${Math.round(bgRGB.g)},${Math.round(bgRGB.b)}], Specular: ${specularPct.toFixed(1)}%, Opaque: ${opaquePct.toFixed(1)}%, Substance HSL: [${h},${s}%,${l}%]`);

          let matched = null;
          let isGreyZone = false;

          // 1. CLEAR CHECK FIRST!
          // If there is very little opaque substance that deviates from the background, 
          // it means the image is just background (e.g. finger) + wet glare.
          if (opaquePct < 8) {
             matched = MUCUS_COLORS.find(c => c.id === 'clear');
          }

          // 2. Black / Dark check
          if (!matched && l <= 25) {
            matched = MUCUS_COLORS.find(c => c.id === 'black');
          } 
          
          // 3. HUE-based classification (Green, Yellow, Brown/Red)
          if (!matched) {
            for (const mc of MUCUS_COLORS) {
              if (!mc.hueRange) continue;
              const inHue = (h >= mc.hueRange[0] && h <= mc.hueRange[1]) ||
                            (mc.altHueRange && h >= mc.altHueRange[0] && h <= mc.altHueRange[1]);
              if (inHue && s >= mc.satRange[0] && s <= mc.satRange[1] &&
                  l >= mc.lightRange[0] && l <= mc.lightRange[1]) {
                matched = mc;
                break;
              }
            }
          }

          // 4. White vs Clear Fallback (if hue didn't match distinct colors)
          if (!matched) {
            if (opaquePct > 12) {
               matched = MUCUS_COLORS.find(c => c.id === 'white');
            } else {
               matched = MUCUS_COLORS.find(c => c.id === 'clear');
            }
            
            // Grey area handling: if user explicitly selected clear/white, respect it in borderline cases
            if (userSelectedColor && (userSelectedColor.id === 'clear' || userSelectedColor.id === 'white')) {
               isGreyZone = true;
               matched = MUCUS_COLORS.find(c => c.id === userSelectedColor.id);
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
              description: 'The color could not be clearly detected from the image. Lighting, shadows, or background may be affecting the result.',
              advice: 'Please try taking another photo with better lighting, preferably against a white tissue.'
            };
          }

          resolve({
            detectedColor: matched,
            avgRGB: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
            hsl: { h, s, l },
            isGreyZone
          });
        } catch (err) {
          reject(new Error('Failed to process image data. Please try again.'));
        }
      };
      img.src = URL.createObjectURL(file);
    } catch (err) {
      reject(new Error('An unexpected error occurred. Please try again.'));
    }
  });
};

