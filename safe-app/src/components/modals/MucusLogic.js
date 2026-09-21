
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
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size).data;

          // We sample the center 50% of the image (50x50 region out of 100x100)
          // This prevents background objects or fingers on the edges from skewing the result.
          const centerStart = Math.floor(size * 0.25);
          const centerEnd = Math.floor(size * 0.75);
          let totalR = 0, totalG = 0, totalB = 0;
          let pixelCount = 0;
          const lightnessPixels = [];
          const saturationPixels = [];

          for (let y = centerStart; y < centerEnd; y++) {
            for (let x = centerStart; x < centerEnd; x++) {
              const i = (y * size + x) * 4;
              const r = imageData[i];
              const g = imageData[i + 1];
              const b = imageData[i + 2];
              totalR += r;
              totalG += g;
              totalB += b;
              
              const normR = r / 255;
              const normG = g / 255;
              const normB = b / 255;
              const max = Math.max(normR, normG, normB);
              const min = Math.min(normR, normG, normB);
              
              let pixelL = (max + min) / 2;
              let pixelS = 0;
              if (max !== min) {
                const d = max - min;
                pixelS = pixelL > 0.5 ? d / (2 - max - min) : d / (max + min);
              }
              
              lightnessPixels.push(pixelL * 100);
              saturationPixels.push(pixelS * 100);
              pixelCount++;
            }
          }

          const avgR = totalR / pixelCount;
          const avgG = totalG / pixelCount;
          const avgB = totalB / pixelCount;

          // Calculate stdDev of Lightness
          let totalL = 0;
          for (let i = 0; i < lightnessPixels.length; i++) {
            totalL += lightnessPixels[i];
          }
          const avgL = totalL / pixelCount;
          
          let varianceL = 0;
          for (let i = 0; i < lightnessPixels.length; i++) {
            varianceL += Math.pow(lightnessPixels[i] - avgL, 2);
          }
          const stdDevL = Math.sqrt(varianceL / pixelCount);

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

          console.log(`[MucusScan Debug] Center sampling (${pixelCount} px). Avg RGB: [${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}], HSL: [${h}, ${s}%, ${l}%], StdDev L: ${stdDevL.toFixed(2)}`);

          let matched = null;
          let isGreyZone = false;

          // 1. Black / Dark check first
          if (l <= 25) {
            matched = MUCUS_COLORS.find(c => c.id === 'black');
          } 
          
          // 2. HUE-based classification for distinct colors (Green, Yellow, Brown/Red)
          if (!matched) {
            for (const mc of MUCUS_COLORS) {
              if (!mc.hueRange) continue; // Skip Clear, White, and Black (already checked)
              const inHue = (h >= mc.hueRange[0] && h <= mc.hueRange[1]) ||
                            (mc.altHueRange && h >= mc.altHueRange[0] && h <= mc.altHueRange[1]);
              if (inHue && s >= mc.satRange[0] && s <= mc.satRange[1] &&
                  l >= mc.lightRange[0] && l <= mc.lightRange[1]) {
                matched = mc;
                break;
              }
            }
          }

          // 3. Achromatic / Near-White classification (Clear vs White)
          // ONLY if it didn't lean into any specific distinct color hue
          if (!matched && s <= 25 && l >= 45) {
            // === Clear vs White: "Prove it's White, else it's Clear" ===
            // White mucus is OPAQUE → it lowers brightness, adds 3D texture, slight cloudiness
            // Clear mucus is TRANSPARENT → tissue looks nearly unchanged, almost invisible
            // Strategy: collect evidence FOR White. If insufficient → default to Clear.
            
            let whiteEvidence = 0;

            // Signal 1: Lightness drop (opaque substance lowers avg brightness vs bare tissue)
            if (l <= 70) whiteEvidence += 3;
            else if (l <= 75) whiteEvidence += 2;
            else if (l <= 78) whiteEvidence += 1;

            // Signal 2: High texture variance (3D opaque blob creates shadows & highlights)
            if (stdDevL >= 15) whiteEvidence += 3;
            else if (stdDevL >= 12) whiteEvidence += 2;
            else if (stdDevL >= 9) whiteEvidence += 1;

            // Signal 3: Fewer bright-achromatic pixels (opaque blob blocks tissue brightness)
            let brightAchromaticCount = 0;
            for (let i = 0; i < lightnessPixels.length; i++) {
              if (lightnessPixels[i] > 82 && saturationPixels[i] < 8) {
                brightAchromaticCount++;
              }
            }
            const brightAchromaticPct = (brightAchromaticCount / pixelCount) * 100;

            if (brightAchromaticPct <= 15) whiteEvidence += 2;
            else if (brightAchromaticPct <= 30) whiteEvidence += 1;

            console.log(`[MucusScan Clear/White] L=${l}, stdDevL=${stdDevL.toFixed(2)}, S=${s}, brightAchromatic=${brightAchromaticPct.toFixed(1)}% -> whiteEvidence=${whiteEvidence}`);

            // Strong evidence for White (>= 5 points) → confidently White
            if (whiteEvidence >= 5) {
              matched = MUCUS_COLORS.find(c => c.id === 'white');
            }
            // Moderate evidence (3-4 points) → grey zone, use tiebreakers
            else if (whiteEvidence >= 3) {
              isGreyZone = true;
              if (userSelectedColor) {
                if (userSelectedColor.id === 'white') {
                  matched = MUCUS_COLORS.find(c => c.id === 'white');
                } else if (userSelectedColor.id === 'clear') {
                  matched = MUCUS_COLORS.find(c => c.id === 'clear');
                }
              }
              if (!matched && questionnaireData) {
                const symptoms = questionnaireData.symptoms || {};
                const hasSevereSymptoms = Object.values(symptoms).some(v => v === 'Very Often' || v === 'Often');
                matched = MUCUS_COLORS.find(c => c.id === (hasSevereSymptoms ? 'white' : 'clear'));
              }
              if (!matched) {
                matched = MUCUS_COLORS.find(c => c.id === 'clear'); // grey-zone default: Clear
              }
            }
            // Weak/no evidence for White (< 3) → it's Clear
            else {
              matched = MUCUS_COLORS.find(c => c.id === 'clear');
            }
          }

          if (!matched) {
            console.log(`[MucusScan Debug] No strict match found. Defaulting to Unclear Detection.`);
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

          const result = {
            detectedColor: matched,
            avgRGB: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
            hsl: { h, s, l },
            isGreyZone
          };
          resolve(result);
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

