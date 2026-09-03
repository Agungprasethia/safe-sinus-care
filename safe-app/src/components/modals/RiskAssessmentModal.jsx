import React, { useState, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Download, RefreshCcw, Save, Camera, Upload, Droplet, X, AlertTriangle, Info } from 'lucide-react';
import './RiskAssessmentModal.css';

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
    satRange: [30, 100],
    lightRange: [50, 85],
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
    hueRange: [80, 160],
    satRange: [20, 100],
    lightRange: [25, 75],
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
    satRange: [20, 80],
    lightRange: [20, 60],
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
    lightRange: [0, 20],
    riskScore: 4,
    severity: 'Serious',
    description: 'Black mucus can be caused by heavy pollution, smoke inhalation, or in rare cases, a serious fungal infection (especially in immunocompromised individuals).',
    advice: 'Seek medical attention promptly, especially if you have a weakened immune system or no clear environmental cause.'
  }
];

const SYMPTOMS = [
  "Nasal obstruction or congestion",
  "Thick or discolored nasal discharge",
  "Facial pain",
  "Pressure or fullness in your face",
  "Reduced sense of smell",
  "Nasal discharge at the back of your throat",
  "Cough",
  "Pain or pressure in your ears",
  "Dental pain",
  "Bad breath",
  "Fatigue",
  "Fever",
  "Swelling or tenderness around your cheeks or eyes",
  "Difficulty breathing through your nose"
];

const LIFESTYLE_QUESTIONS = [
  {
    question: "Sleep Duration",
    options: ["7–9 hours", "6–7 hours", "Less than 6 hours", "Irregular sleep schedule"]
  },
  {
    question: "Stress Frequency",
    options: ["Never", "Rarely", "Sometimes", "Often", "Almost every day"]
  },
  {
    question: "Physical Activity",
    options: ["Every day", "3–5 times/week", "1–2 times/week", "Rarely", "Never"]
  },
  {
    question: "Swimming Frequency",
    options: ["Never", "Rarely", "1–2 times/month", "1–2 times/week", "3+ times/week"]
  },
  {
    question: "Nasal Spray Usage",
    options: ["Never", "Occasionally", "Several times/month", "Several times/week", "Almost every day"]
  }
];

const ENVIRONMENTAL = [
  "Sudden weather changes",
  "Dry or highly humid environments",
  "Outdoor air pollution",
  "Smoke exposure",
  "Increased pollen exposure",
  "Damp environments after flooding",
  "Poor indoor air quality"
];

const RiskAssessmentModal = () => {
  const [step, setStep] = useState(1);

  const [answers, setAnswers] = useState({
    symptoms: {},
    lifestyle: {},
    environmental: {}
  });

  // Mucus upload state
  const [mucusImage, setMucusImage] = useState(null);
  const [mucusPreview, setMucusPreview] = useState(null);
  const [mucusAnalysis, setMucusAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const canvasRef = useRef(null);

  const STEPS = ["Symptoms", "Lifestyle", "Environment", "Mucus Scan", "Results"];
  const totalAnswered = Object.keys(answers.symptoms).length + Object.keys(answers.lifestyle).length + Object.keys(answers.environmental).length;
  const totalQuestions = SYMPTOMS.length + LIFESTYLE_QUESTIONS.length + ENVIRONMENTAL.length;
  const mucusCompleted = mucusAnalysis ? 1 : 0;
  const progressPercentage = ((totalAnswered + mucusCompleted) / (totalQuestions + 1)) * 100;

  const handleSelectSymptom = (index, answer) => {
    setAnswers(prev => ({ ...prev, symptoms: { ...prev.symptoms, [index]: answer } }));
  };

  const handleSelectLifestyle = (index, answer) => {
    setAnswers(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, [index]: answer } }));
  };

  const handleSelectEnv = (index, answer) => {
    setAnswers(prev => ({ ...prev, environmental: { ...prev.environmental, [index]: answer } }));
  };

  const SYMPTOM_WEIGHTS = { "Very Often": 3, "Often": 2, "Sometimes": 1, "Never": 0 };
  const ENV_WEIGHTS = { "Almost every day": 4, "Often": 3, "Sometimes": 2, "Rarely": 1, "Never": 0 };

  const calcSymptomsScore = () => {
    const vals = Object.values(answers.symptoms);
    if (vals.length === 0) return 0;
    const total = vals.reduce((sum, v) => sum + (SYMPTOM_WEIGHTS[v] || 0), 0);
    return Math.round((total / (SYMPTOMS.length * 3)) * 100);
  };

  const calcLifestyleScore = () => {
    const vals = Object.values(answers.lifestyle);
    if (vals.length === 0) return 0;
    let total = 0;
    vals.forEach((v, i) => {
      const options = LIFESTYLE_QUESTIONS[i]?.options || [];
      const idx = options.indexOf(v);
      total += idx >= 0 ? idx : 0;
    });
    const maxScore = LIFESTYLE_QUESTIONS.reduce((s, q) => s + (q.options.length - 1), 0);
    return Math.round((total / maxScore) * 100);
  };

  const calcEnvScore = () => {
    const vals = Object.values(answers.environmental);
    if (vals.length === 0) return 0;
    const total = vals.reduce((sum, v) => sum + (ENV_WEIGHTS[v] || 0), 0);
    return Math.round((total / (ENVIRONMENTAL.length * 4)) * 100);
  };

  const getScoreLabel = (score) => {
    if (score <= 25) return { label: 'Low', cls: 'success' };
    if (score <= 55) return { label: 'Moderate', cls: 'warning' };
    return { label: 'High', cls: 'danger' };
  };

  const getScoreColor = (score) => {
    if (score <= 25) return 'var(--success)';
    if (score <= 55) return 'var(--warning)';
    return 'var(--danger)';
  };

  // --- Mucus analysis functions ---
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

      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        totalR += imageData[i];
        totalG += imageData[i + 1];
        totalB += imageData[i + 2];
        count++;
      }
      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;

      // Convert to HSL
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

      // Match to mucus color
      let matched = MUCUS_COLORS[0]; // default clear

      // Check lightness extremes first
      if (l <= 20) {
        matched = MUCUS_COLORS.find(c => c.id === 'black');
      } else if (s <= 15 && l >= 80) {
        matched = MUCUS_COLORS.find(c => c.id === 'clear');
      } else if (s <= 20 && l >= 60 && l < 80) {
        matched = MUCUS_COLORS.find(c => c.id === 'white');
      } else {
        // Check hue-based colors
        for (const mc of MUCUS_COLORS) {
          if (!mc.hueRange) continue;
          if (h >= mc.hueRange[0] && h <= mc.hueRange[1] &&
              s >= mc.satRange[0] && s <= mc.satRange[1] &&
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
    setMucusImage(file);
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
    setMucusImage(null);
    setMucusPreview(null);
    setMucusAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getMucusRiskScore = () => {
    if (!mucusAnalysis) return 0;
    return Math.round((mucusAnalysis.detectedColor.riskScore / 4) * 100);
  };

  const calculateRisk = () => {
    const scores = [calcSymptomsScore(), calcLifestyleScore(), calcEnvScore()];
    if (mucusAnalysis) scores.push(getMucusRiskScore());
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    if (avg <= 25) return "Low Risk";
    if (avg <= 55) return "Moderate Risk";
    return "High Risk";
  };

  const saveAssessment = () => {
    const riskLevel = calculateRisk();
    const now = new Date();
    const newEntry = {
      id: Date.now(),
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      riskLevel: riskLevel,
      scores: {
        symptoms: calcSymptomsScore(),
        lifestyle: calcLifestyleScore(),
        environmental: calcEnvScore(),
        mucus: mucusAnalysis ? getMucusRiskScore() : null
      },
      mucusColor: mucusAnalysis?.detectedColor?.label || null
    };

    const existingHistory = JSON.parse(localStorage.getItem('sinus_assessment_history') || '[]');
    const updatedHistory = [newEntry, ...existingHistory];
    localStorage.setItem('sinus_assessment_history', JSON.stringify(updatedHistory));
    
    alert('Assessment saved successfully! You can view it in the History Scan section.');
  };

  const downloadResult = () => {
    const sScore = calcSymptomsScore();
    const lScore = calcLifestyleScore();
    const eScore = calcEnvScore();
    const mScore = mucusAnalysis ? getMucusRiskScore() : null;
    const risk = calculateRisk();
    const now = new Date();

    let report = `S.A.F.E. — Sinus Risk Assessment Report\n`;
    report += `========================================\n`;
    report += `Date: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    report += `Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    report += `OVERALL RISK: ${risk}\n\n`;
    report += `--- Scores ---\n`;
    report += `Symptoms Score:      ${sScore}% (${getScoreLabel(sScore).label})\n`;
    report += `Lifestyle Score:     ${lScore}% (${getScoreLabel(lScore).label})\n`;
    report += `Environmental Score: ${eScore}% (${getScoreLabel(eScore).label})\n`;
    if (mScore !== null) {
      report += `Mucus Color Score:   ${mScore}% (${getScoreLabel(mScore).label})\n`;
      report += `Detected Color:      ${mucusAnalysis.detectedColor.label} — ${mucusAnalysis.detectedColor.severity}\n`;
    }
    report += `\n--- Symptom Answers ---\n`;
    SYMPTOMS.forEach((s, i) => {
      report += `  ${s}: ${answers.symptoms[i] || 'Not answered'}\n`;
    });
    report += `\n--- Lifestyle Answers ---\n`;
    LIFESTYLE_QUESTIONS.forEach((q, i) => {
      report += `  ${q.question}: ${answers.lifestyle[i] || 'Not answered'}\n`;
    });
    report += `\n--- Environmental Answers ---\n`;
    ENVIRONMENTAL.forEach((e, i) => {
      report += `  ${e}: ${answers.environmental[i] || 'Not answered'}\n`;
    });
    if (mucusAnalysis) {
      report += `\n--- Mucus Analysis ---\n`;
      report += `  Detected Color: ${mucusAnalysis.detectedColor.label}\n`;
      report += `  Severity: ${mucusAnalysis.detectedColor.severity}\n`;
      report += `  Description: ${mucusAnalysis.detectedColor.description}\n`;
      report += `  Advice: ${mucusAnalysis.detectedColor.advice}\n`;
    }
    report += `\n========================================\n`;
    report += `Disclaimer: This result is for screening purposes only and is not a medical diagnosis.\n`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAFE_Assessment_${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAssessment = () => {
    setStep(1);
    setAnswers({ symptoms: {}, lifestyle: {}, environmental: {} });
    removeMucusImage();
  };

  const symptomsScore = calcSymptomsScore();
  const lifestyleScore = calcLifestyleScore();
  const envScore = calcEnvScore();
  const mucusScore = getMucusRiskScore();
  const symptomsLabel = getScoreLabel(symptomsScore);
  const lifestyleLabel = getScoreLabel(lifestyleScore);
  const envLabel = getScoreLabel(envScore);
  const mucusLabel = mucusAnalysis ? getScoreLabel(mucusScore) : null;

  return (
    <div className="risk-modal">
      {/* Top Progress Bar */}
      <div className="risk-header">
        <div className="steps-indicator">
          {STEPS.map((s, i) => (
            <div 
              key={i} 
              className={`step-item ${step > i ? 'active' : ''} ${step === i + 1 ? 'current' : ''}`}
              onClick={() => setStep(i + 1)}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-label">Step {i + 1} &rarr; {s}</div>
            </div>
          ))}
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="progress-text">{Math.round(progressPercentage)}% Complete</div>
      </div>

      <div className="risk-content">
        {step === 1 && (
          <div className="question-slide animate-slide-in">
            <h2 className="slide-title">Symptom Assessment</h2>
            <p className="slide-subtitle">Please select how often you experience each symptom.</p>
            
            <div className="questions-list">
              {SYMPTOMS.map((symptom, index) => (
                <div key={index} className="question-card card">
                  <span className="question-number">Question {index + 1} of {SYMPTOMS.length}</span>
                  <h3>{symptom}</h3>
                  <div className="options-grid">
                    {["Very Often", "Often", "Sometimes", "Never"].map(opt => (
                      <div 
                        key={opt} 
                        className={`selectable-card ${answers.symptoms[index] === opt ? 'selected' : ''}`}
                        onClick={() => handleSelectSymptom(index, opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="slide-actions slide-actions-right">
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(2)}
              >
                Next <ChevronRight size={20} />
              </button>
            </div>

            <div className="slide-footer text-light">
              <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
              <p>Source: NCBI - Sinusitis Clinical Guideline, NHS - Sinusitis Overview</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="question-slide animate-slide-in">
            <h2 className="slide-title">Lifestyle Factors</h2>
            
            <div className="questions-list">
              {LIFESTYLE_QUESTIONS.map((q, index) => (
                <div key={index} className="question-card card">
                  <span className="question-number">Question {index + 1} of {LIFESTYLE_QUESTIONS.length}</span>
                  <h3>{q.question}</h3>
                  <div className="options-grid">
                    {q.options.map(opt => (
                      <div 
                        key={opt} 
                        className={`selectable-card ${answers.lifestyle[index] === opt ? 'selected' : ''}`}
                        onClick={() => handleSelectLifestyle(index, opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="slide-actions">
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(3)}
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="slide-footer text-light">
              <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
              <p>Source: Max Healthcare, Sinus Infection: Causes, Lifestyle Factors & Prevention Tips (2026)</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="question-slide animate-slide-in">
            <h2 className="slide-title">Environmental Factors</h2>
            
            <div className="questions-list">
              {ENVIRONMENTAL.map((env, index) => (
                <div key={index} className="question-card card">
                  <span className="question-number">Question {index + 1} of {ENVIRONMENTAL.length}</span>
                  <h3>{env}</h3>
                  <div className="options-grid">
                    {["Never", "Rarely", "Sometimes", "Often", "Almost every day"].map(opt => (
                      <div 
                        key={opt} 
                        className={`selectable-card ${answers.environmental[index] === opt ? 'selected' : ''}`}
                        onClick={() => handleSelectEnv(index, opt)}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="slide-actions">
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(4)}
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="slide-footer text-light">
              <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
              <p>Source: University Hospitals (2024), Del Rey MD</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="question-slide animate-slide-in">
            <h2 className="slide-title"><Droplet size={24} style={{display:'inline', verticalAlign:'middle', marginRight:'0.5rem', color:'var(--primary)'}} />Mucus Color Scan</h2>
            <p className="slide-subtitle">Upload or take a photo of your nasal mucus to analyze its color and get health insights.</p>

            <canvas ref={canvasRef} style={{display:'none'}} />

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{display:'none'}}
              id="mucus-file-input"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              style={{display:'none'}}
              id="mucus-camera-input"
            />

            {!mucusPreview ? (
              <div
                className={`mucus-dropzone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon">
                  <Upload size={48} />
                </div>
                <h3>Upload Mucus Photo</h3>
                <p>Drag & drop an image here, or click to browse</p>
                <div className="dropzone-buttons">
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
              <div className="mucus-preview-container">
                <div className="mucus-preview-image-wrapper">
                  <img src={mucusPreview} alt="Mucus sample" className="mucus-preview-image" />
                  <button className="mucus-remove-btn" onClick={removeMucusImage} title="Remove image">
                    <X size={18} />
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="mucus-analyzing card">
                    <div className="analyzing-spinner"></div>
                    <p>Analyzing mucus color...</p>
                  </div>
                )}

                {mucusAnalysis && (
                  <div className="mucus-result card">
                    <div className="mucus-result-header">
                      <div
                        className="mucus-color-swatch"
                        style={{
                          backgroundColor: mucusAnalysis.detectedColor.color,
                          border: mucusAnalysis.detectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                        }}
                      ></div>
                      <div className="mucus-result-info">
                        <h3>{mucusAnalysis.detectedColor.label}</h3>
                        <span className={`score-badge ${
                          mucusAnalysis.detectedColor.riskScore <= 1 ? 'success' :
                          mucusAnalysis.detectedColor.riskScore <= 2 ? 'warning' : 'danger'
                        }`}>
                          {mucusAnalysis.detectedColor.severity}
                        </span>
                      </div>
                    </div>
                    <p className="mucus-description">{mucusAnalysis.detectedColor.description}</p>
                    <div className="mucus-advice">
                      <Info size={16} />
                      <p>{mucusAnalysis.detectedColor.advice}</p>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-outline mucus-retake-btn"
                  onClick={removeMucusImage}
                >
                  <Camera size={18} /> Retake / Upload New Photo
                </button>
              </div>
            )}

            {/* Color Reference Guide */}
            <div className="mucus-color-guide card">
              <h3><Info size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'0.5rem'}} />Mucus Color Reference Guide</h3>
              <div className="color-guide-grid">
                {MUCUS_COLORS.map(mc => (
                  <div key={mc.id} className="color-guide-item">
                    <div
                      className="color-guide-swatch"
                      style={{
                        backgroundColor: mc.color,
                        color: mc.textColor,
                        border: mc.id === 'clear' ? '2px solid var(--border)' : 'none'
                      }}
                    >
                      <Droplet size={16} />
                    </div>
                    <div className="color-guide-text">
                      <strong>{mc.label}</strong>
                      <span className="color-guide-severity">{mc.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mucus-disclaimer">
              <AlertTriangle size={16} />
              <p>This color analysis is based on average pixel detection and is for screening purposes only. Lighting conditions may affect accuracy. Always consult a healthcare professional for proper diagnosis.</p>
            </div>

            <div className="slide-actions">
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(5)}
              >
                See Results <ChevronRight size={20} />
              </button>
            </div>

            <div className="slide-footer text-light">
              <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
              <p>Source: Cleveland Clinic — What the Color of Your Snot Really Means (2024)</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="results-slide animate-fade-in">
            <h2 className="text-center">Your Sinus Risk Assessment</h2>
            
            <div className="results-dashboard">
              <div className="gauge-container card">
                <div className="circular-gauge">
                  <div className="gauge-circle">
                    <span className="gauge-value">{calculateRisk()}</span>
                  </div>
                </div>
                <h3>Overall Risk Score</h3>
              </div>

              <div className="scores-breakdown">
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Symptoms Score</h4>
                    <span className={`score-badge ${symptomsLabel.cls}`}>{symptomsLabel.label}</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${symptomsScore}%`, backgroundColor: getScoreColor(symptomsScore)}}></div></div>
                </div>
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Lifestyle Score</h4>
                    <span className={`score-badge ${lifestyleLabel.cls}`}>{lifestyleLabel.label}</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${lifestyleScore}%`, backgroundColor: getScoreColor(lifestyleScore)}}></div></div>
                </div>
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Environmental Score</h4>
                    <span className={`score-badge ${envLabel.cls}`}>{envLabel.label}</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${envScore}%`, backgroundColor: getScoreColor(envScore)}}></div></div>
                </div>

                {mucusAnalysis && (
                  <div className="score-card card mucus-score-card">
                    <div className="score-header">
                      <h4><Droplet size={16} style={{display:'inline', verticalAlign:'middle', marginRight:'0.375rem'}} />Mucus Color Score</h4>
                      <span className={`score-badge ${mucusLabel.cls}`}>{mucusLabel.label}</span>
                    </div>
                    <div className="progress-container"><div className="progress-bar" style={{width: `${mucusScore}%`, backgroundColor: getScoreColor(mucusScore)}}></div></div>
                    <div className="mucus-result-mini">
                      <div
                        className="mucus-color-swatch-sm"
                        style={{
                          backgroundColor: mucusAnalysis.detectedColor.color,
                          border: mucusAnalysis.detectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                        }}
                      ></div>
                      <span>{mucusAnalysis.detectedColor.label} — {mucusAnalysis.detectedColor.severity}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="recommendations card">
              <h3>Personalized Recommendations</h3>
              <ul>
                <li><CheckCircle2 size={16} className="text-success" /> Consider using a saline nasal spray daily.</li>
                <li><CheckCircle2 size={16} className="text-success" /> Reduce exposure to outdoor air pollution when possible.</li>
                <li><CheckCircle2 size={16} className="text-success" /> Consult an ENT specialist if facial pain persists.</li>
                {mucusAnalysis && mucusAnalysis.detectedColor.riskScore >= 2 && (
                  <li><CheckCircle2 size={16} className="text-success" /> {mucusAnalysis.detectedColor.advice}</li>
                )}
              </ul>
            </div>

            <div className="results-actions flex justify-center gap-4 mt-6">
              <button className="btn btn-primary" onClick={saveAssessment}><Save size={18} /> Save Assessment</button>
              <button className="btn btn-secondary" onClick={downloadResult}><Download size={18} /> Download Result</button>
              <button className="btn btn-outline" onClick={resetAssessment}><RefreshCcw size={18} /> Retake Assessment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAssessmentModal;

