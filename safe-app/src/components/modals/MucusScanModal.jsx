import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Droplet, X, AlertTriangle, Info } from 'lucide-react';
import './MucusScanModal.css';

const MUCUS_COLORS = [
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
    satRange: [15, 100],
    lightRange: [30, 90],
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
    satRange: [15, 100],
    lightRange: [20, 85],
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
    satRange: [15, 100],
    lightRange: [15, 80],
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

const MucusScanModal = () => {
  const [mucusPreview, setMucusPreview] = useState(null);
  const [mucusAnalysis, setMucusAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const canvasRef = useRef(null);

  const analyzeMucusColor = useCallback((imageFile) => {
    setIsAnalyzing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;

      let pixels = [];
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        const rNorm = r/255, gNorm = g/255, bNorm = b/255;
        const maxC = Math.max(rNorm, gNorm, bNorm);
        const minC = Math.min(rNorm, gNorm, bNorm);
        const l = (maxC + minC) / 2;
        let s = 0;
        if (maxC !== minC) {
          s = l > 0.5 ? (maxC - minC) / (2 - maxC - minC) : (maxC - minC) / (maxC + minC);
        }
        
        const chroma = s * (1 - Math.abs(2*l - 1));
        pixels.push({ r, g, b, chroma, l, s });
      }

      pixels.sort((a, b) => b.chroma - a.chroma);
      
      const topCount = Math.max(1, Math.floor(pixels.length * 0.15));
      let topPixels = pixels.slice(0, topCount);
      
      let totalR = 0, totalG = 0, totalB = 0;
      for (const p of topPixels) {
        totalR += p.r;
        totalG += p.g;
        totalB += p.b;
      }
      const avgR = totalR / topPixels.length;
      const avgG = totalG / topPixels.length;
      const avgB = totalB / topPixels.length;

      const r = avgR / 255, g = avgG / 255, b = avgB / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
          default: break;
        }
      }
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);

      let matched = MUCUS_COLORS[0];

      if (l <= 25) {
        matched = MUCUS_COLORS.find(c => c.id === 'black');
      } else if (s <= 15 && l >= 75) {
        matched = MUCUS_COLORS.find(c => c.id === 'clear');
      } else if (s <= 20 && l >= 55 && l < 75) {
        matched = MUCUS_COLORS.find(c => c.id === 'white');
      } else {
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

      setMucusAnalysis({
        detectedColor: matched,
        avgRGB: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
        hsl: { h, s, l }
      });
      setIsAnalyzing(false);
    };
    img.src = URL.createObjectURL(imageFile);
  }, []);

  const handleMucusUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setMucusPreview(URL.createObjectURL(file));
    setMucusAnalysis(null);
    analyzeMucusColor(file);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleMucusUpload(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleMucusUpload(e.dataTransfer.files[0]);
  };

  const removeMucusImage = () => {
    setMucusPreview(null);
    setMucusAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getSeverityClass = (riskScore) => {
    if (riskScore <= 1) return 'success';
    if (riskScore <= 2) return 'warning';
    return 'danger';
  };

  return (
    <div className="mucus-modal">
      <div className="mucus-modal-header">
        <Droplet size={28} className="mucus-modal-icon" />
        <div>
          <h2>Mucus Color Scan</h2>
          <p>Upload or take a photo of your nasal mucus to analyze its color and get health insights.</p>
        </div>
      </div>

      <canvas ref={canvasRef} style={{display:'none'}} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{display:'none'}}
        id="mucus-standalone-file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        style={{display:'none'}}
        id="mucus-standalone-camera"
      />

      {!mucusPreview ? (
        <div
          className={`ms-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="ms-dropzone-icon">
            <Upload size={48} />
          </div>
          <h3>Upload Mucus Photo</h3>
          <p>Drag & drop an image here, or click to browse</p>
          <div className="ms-dropzone-buttons">
            <button
              className="btn btn-primary"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <Upload size={18} /> Choose File
            </button>
            <button
              className="btn btn-secondary"
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
            >
              <Camera size={18} /> Take Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="ms-preview-container">
          <div className="ms-preview-image-wrapper">
            <img src={mucusPreview} alt="Mucus sample" className="ms-preview-image" />
            <button className="ms-remove-btn" onClick={removeMucusImage} title="Remove image">
              <X size={18} />
            </button>
          </div>

          {isAnalyzing && (
            <div className="ms-analyzing card">
              <div className="ms-spinner"></div>
              <p>Analyzing mucus color...</p>
            </div>
          )}

          {mucusAnalysis && (
            <div className="ms-result card">
              <div className="ms-result-header">
                <div
                  className="ms-color-swatch"
                  style={{
                    backgroundColor: mucusAnalysis.detectedColor.color,
                    border: mucusAnalysis.detectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                  }}
                ></div>
                <div className="ms-result-info">
                  <h3>{mucusAnalysis.detectedColor.label}</h3>
                  <span className={`score-badge ${getSeverityClass(mucusAnalysis.detectedColor.riskScore)}`}>
                    {mucusAnalysis.detectedColor.severity}
                  </span>
                </div>
              </div>
              <p className="ms-description">{mucusAnalysis.detectedColor.description}</p>
              <div className="ms-advice">
                <Info size={16} />
                <p>{mucusAnalysis.detectedColor.advice}</p>
              </div>
            </div>
          )}

          <button
            className="btn btn-outline ms-retake-btn"
            onClick={removeMucusImage}
          >
            <Camera size={18} /> Retake / Upload New Photo
          </button>
        </div>
      )}

      {/* Color Reference Guide */}
      <div className="ms-color-guide card">
        <h3><Info size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'0.5rem'}} />Mucus Color Reference Guide</h3>
        <div className="ms-guide-grid">
          {MUCUS_COLORS.map(mc => (
            <div key={mc.id} className="ms-guide-item">
              <div
                className="ms-guide-swatch"
                style={{
                  backgroundColor: mc.color,
                  color: mc.textColor,
                  border: mc.id === 'clear' ? '2px solid var(--border)' : 'none'
                }}
              >
                <Droplet size={16} />
              </div>
              <div className="ms-guide-text">
                <strong>{mc.label}</strong>
                <span className="ms-guide-severity">{mc.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ms-disclaimer">
        <AlertTriangle size={16} />
        <p>This color analysis is based on average pixel detection and is for screening purposes only. Lighting conditions may affect accuracy. Always consult a healthcare professional for proper diagnosis.</p>
      </div>

      <div className="ms-footer">
        <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
        <p>Source: Cleveland Clinic — What the Color of Your Snot Really Means (2024)</p>
      </div>
    </div>
  );
};

export default MucusScanModal;
