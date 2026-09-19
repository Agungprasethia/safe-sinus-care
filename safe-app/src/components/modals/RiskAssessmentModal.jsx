import React, { useState, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Download, RefreshCcw, Save, Camera, Upload, Droplet, X, AlertTriangle, Info, Search, RefreshCw } from 'lucide-react';
import './RiskAssessmentModal.css';
import { analyzeMucusColorImage, MUCUS_COLORS } from './MucusLogic';



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
    environmental: {},
    mucusColor: null,
    mucusImage: null,
    mucusPreview: null,
    mucusResult: null
  });
  const [isScanningMucus, setIsScanningMucus] = useState(false);
  const [mucusScanError, setMucusScanError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const STEPS = ["Symptoms", "Lifestyle", "Environment", "Mucus Scan", "Results"];
  const totalAnswered = Object.keys(answers.symptoms).length + Object.keys(answers.lifestyle).length + Object.keys(answers.environmental).length + (answers.mucusResult ? 1 : 0);
  const totalQuestions = SYMPTOMS.length + LIFESTYLE_QUESTIONS.length + ENVIRONMENTAL.length + 1;
  const progressPercentage = (totalAnswered / totalQuestions) * 100;

  const isStep1Complete = Object.keys(answers.symptoms).length === SYMPTOMS.length;
  const isStep2Complete = Object.keys(answers.lifestyle).length === LIFESTYLE_QUESTIONS.length;
  const isStep3Complete = Object.keys(answers.environmental).length === ENVIRONMENTAL.length;
  const isStep4Complete = answers.mucusResult !== null;

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

  const calcMucusScore = () => {
    if (!answers.mucusResult) return 0;
    
    // Prevent double counting symptom severity:
    // If the color was decided in the grey zone (where symptoms might have influenced the result),
    // fallback to using the manually selected color's risk score.
    const riskScoreToUse = answers.mucusResult.isGreyZone && answers.mucusColor
      ? answers.mucusColor.riskScore
      : answers.mucusResult.detectedColor.riskScore;
      
    return Math.round((riskScoreToUse / 4) * 100);
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



  const calculateRisk = () => {
    const scores = [calcSymptomsScore(), calcLifestyleScore(), calcEnvScore()];
    if (answers.mucusResult) scores.push(calcMucusScore());
    
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    if (avg <= 25) return "Low Risk";
    if (avg <= 55) return "Moderate Risk";
    return "High Risk";
  };

  const saveAssessment = () => {
    const riskLevel = calculateRisk();
    const now = new Date();
    let finalMucusLabel = null;
    if (answers.mucusResult) {
      finalMucusLabel = answers.mucusResult.isGreyZone && answers.mucusColor 
        ? answers.mucusColor.label 
        : answers.mucusResult.detectedColor.label;
    }
    
    const newEntry = {
      id: Date.now(),
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      riskLevel: riskLevel,
      scores: {
        symptoms: calcSymptomsScore(),
        lifestyle: calcLifestyleScore(),
        environmental: calcEnvScore(),
        mucus: calcMucusScore()
      },
      mucusColorLabel: finalMucusLabel
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
    const mScore = calcMucusScore();
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
    if (answers.mucusResult) {
      const finalMucusLabel = answers.mucusResult.isGreyZone && answers.mucusColor 
        ? answers.mucusColor.label 
        : answers.mucusResult.detectedColor.label;
      report += `Mucus Scan Score:    ${mScore}% (${finalMucusLabel})\n`;
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
    setAnswers({ 
      symptoms: {}, 
      lifestyle: {}, 
      environmental: {},
      mucusColor: null,
      mucusImage: null,
      mucusPreview: null,
      mucusResult: null
    });
  };

  const symptomsScore = calcSymptomsScore();
  const lifestyleScore = calcLifestyleScore();
  const envScore = calcEnvScore();
  const mucusScore = calcMucusScore();
  const symptomsLabel = getScoreLabel(symptomsScore);
  const lifestyleLabel = getScoreLabel(lifestyleScore);
  const envLabel = getScoreLabel(envScore);
  const mucusLabel = getScoreLabel(mucusScore);

  const handleMucusUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMucusScanError('Please upload a valid image file (JPG, PNG, etc.).');
      return;
    }
    setAnswers(prev => ({ 
      ...prev, 
      mucusImage: file,
      mucusPreview: URL.createObjectURL(file),
      mucusResult: null
    }));
    setMucusScanError(null);
  };

  const handleScanMucus = async () => {
    if (!answers.mucusColor || !answers.mucusImage) {
      setMucusScanError('Please select color and upload image first.');
      return;
    }
    setMucusScanError(null);
    setIsScanningMucus(true);
    
    try {
      const result = await analyzeMucusColorImage(answers.mucusImage, answers.mucusColor, { symptoms: answers.symptoms });
      setAnswers(prev => ({ ...prev, mucusResult: result }));
    } catch (err) {
      setMucusScanError(err.message || 'Scan failed.');
    } finally {
      setIsScanningMucus(false);
    }
  };

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
              <div className="step-label">
                <span className="step-num">Step {i + 1}</span>
                <span className="step-desc"> &rarr; {s}</span>
              </div>
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
                disabled={!isStep1Complete}
                style={{ opacity: isStep1Complete ? 1 : 0.5, cursor: isStep1Complete ? 'pointer' : 'not-allowed' }}
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
                disabled={!isStep2Complete}
                style={{ opacity: isStep2Complete ? 1 : 0.5, cursor: isStep2Complete ? 'pointer' : 'not-allowed' }}
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
                disabled={!isStep3Complete}
                style={{ opacity: isStep3Complete ? 1 : 0.5, cursor: isStep3Complete ? 'pointer' : 'not-allowed' }}
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
            <h2 className="slide-title">Mucus Color Scan</h2>
            <p className="slide-subtitle">Add your mucus color analysis to improve risk assessment accuracy.</p>
            
            {mucusScanError && (
              <div className="ms-error-banner" style={{margin: '0 0 1rem 0'}}>
                <AlertTriangle size={18} />
                <p>{mucusScanError}</p>
                <button className="ms-error-close" onClick={() => setMucusScanError(null)}>
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="card" style={{padding: '1.5rem', marginBottom: '1.5rem'}}>
              <h3>1. Select Mucus Color</h3>
              <div className="options-grid" style={{marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'}}>
                {MUCUS_COLORS.map(mc => (
                  <div 
                    key={mc.id}
                    className={`selectable-card ${answers.mucusColor?.id === mc.id ? 'selected' : ''}`}
                    onClick={() => setAnswers(prev => ({...prev, mucusColor: mc, mucusResult: null}))}
                    style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem'}}
                  >
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '50%', backgroundColor: mc.color, 
                      border: mc.id === 'clear' ? '1px solid #cbd5e1' : 'none'
                    }} />
                    <span style={{fontSize: '0.9rem', textAlign: 'center'}}>{mc.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding: '1.5rem', marginBottom: '1.5rem'}}>
              <h3>2. Upload Mucus Photo</h3>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleMucusUpload(e.target.files[0])}
                style={{display:'none'}}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleMucusUpload(e.target.files[0])}
                style={{display:'none'}}
              />

              {!answers.mucusPreview ? (
                <div style={{marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} /> Choose File
                  </button>
                  <button className="btn btn-secondary" onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={18} /> Take Photo
                  </button>
                </div>
              ) : (
                <div style={{marginTop: '1rem', textAlign: 'center'}}>
                  <img src={answers.mucusPreview} alt="Mucus sample" style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px'}} />
                  <div style={{marginTop: '1rem'}}>
                    <button className="btn btn-outline" onClick={() => setAnswers(prev => ({...prev, mucusPreview: null, mucusImage: null, mucusResult: null}))}>
                      <RefreshCw size={16} /> Change Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {answers.mucusResult ? (
               <div className="card" style={{padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--card-hover)'}}>
                 <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)'}}>
                   <CheckCircle2 size={20} /> Scan Complete
                 </h3>
                 <p style={{marginTop: '0.5rem'}}>Detected Color: <strong>{answers.mucusResult.detectedColor.label}</strong></p>
                 <p style={{fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.25rem'}}>{answers.mucusResult.detectedColor.description}</p>
               </div>
            ) : (
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1.5rem'}}>
                <button 
                  className={`btn btn-primary btn-lg ${(!answers.mucusColor || !answers.mucusImage || isScanningMucus) ? 'disabled' : ''}`}
                  onClick={handleScanMucus}
                  disabled={!answers.mucusColor || !answers.mucusImage || isScanningMucus}
                  style={{width: '100%', maxWidth: '300px'}}
                >
                  {isScanningMucus ? 'Analyzing...' : <><Search size={20} /> Scan Mucus Color</>}
                </button>
              </div>
            )}

            <div className="slide-actions">
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep(5)}
                disabled={!isStep4Complete}
                style={{ opacity: isStep4Complete ? 1 : 0.5, cursor: isStep4Complete ? 'pointer' : 'not-allowed' }}
              >
                See Results <ChevronRight size={20} />
              </button>
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
                {answers.mucusResult && (
                  <div className="score-card card">
                    <div className="score-header">
                      <h4>Mucus Score</h4>
                      <span className={`score-badge ${mucusLabel.cls}`}>{mucusLabel.label}</span>
                    </div>
                    <div className="progress-container"><div className="progress-bar" style={{width: `${mucusScore}%`, backgroundColor: getScoreColor(mucusScore)}}></div></div>
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

