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

  const SYMPTOM_BASE = { "Never": 0, "Sometimes": 1, "Often": 2, "Very Often": 3 };
  const ENV_BASE = { "Never": 0, "Rarely": 1, "Sometimes": 2, "Often": 3, "Almost every day": 4 };
  const MUCUS_POINT_MAP = {
    'clear': 0, 'white': 0.5, 'yellow': 1,
    'green': 2, 'brown': 1, 'black': 1
  };

  const calcSymptomsPoints = () => {
    let total = 0;
    Object.entries(answers.symptoms).forEach(([idx, val]) => {
      const base = SYMPTOM_BASE[val] || 0;
      const i = parseInt(idx);
      const weight = i <= 7 ? 4 : 3; // S1-S8 (idx 0-7) = ×4, S9-S14 (idx 8-13) = ×3
      total += base * weight;
    });
    return total;
  };

  const calcLifestylePoints = () => {
    const L_MAP = [
      {"7–9 hours":0, "6–7 hours":1, "Less than 6 hours":2, "Irregular sleep schedule":2},
      {"Never":0, "Rarely":1, "Sometimes":2, "Often":3, "Almost every day":4},
      {"Every day":0, "3–5 times/week":0, "1–2 times/week":1, "Rarely":2, "Never":2},
      {"Never":0, "Rarely":1, "1–2 times/month":1, "1–2 times/week":2, "3+ times/week":3},
      {"Never":0, "Occasionally":1, "Several times/month":2, "Several times/week":3, "Almost every day":4}
    ];
    let total = 0;
    Object.entries(answers.lifestyle).forEach(([idx, val]) => {
      total += L_MAP[parseInt(idx)]?.[val] ?? 0;
    });
    return total;
  };

  const calcEnvPoints = () => {
    let total = 0;
    Object.values(answers.environmental).forEach(v => {
      total += ENV_BASE[v] || 0;
    });
    return total;
  };

  const calcMucusPoints = () => {
    if (!answers.mucusResult) return 0;
    const colorId = answers.mucusResult.isGreyZone && answers.mucusColor
      ? answers.mucusColor.id
      : answers.mucusResult.detectedColor.id;
    return MUCUS_POINT_MAP[colorId] ?? 0;
  };

  const calcFinalScore = () => {
    return calcSymptomsPoints() + calcLifestylePoints() + calcEnvPoints() + calcMucusPoints();
  };

  const getClassification = () => {
    return calcFinalScore() >= 114 ? "SINUS" : "NON-SINUS";
  };

  const getClassificationColor = () => {
    return calcFinalScore() >= 114 ? 'var(--danger)' : 'var(--success)';
  };

  const saveAssessment = () => {
    const finalScore = calcFinalScore();
    const classification = getClassification();
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
      classification: classification,
      finalScore: finalScore,
      maxScore: 195,
      scores: {
        symptoms: calcSymptomsPoints(),
        lifestyle: calcLifestylePoints(),
        environmental: calcEnvPoints(),
        mucus: calcMucusPoints()
      },
      mucusColorLabel: finalMucusLabel
    };

    const existingHistory = JSON.parse(localStorage.getItem('sinus_assessment_history') || '[]');
    const updatedHistory = [newEntry, ...existingHistory];
    localStorage.setItem('sinus_assessment_history', JSON.stringify(updatedHistory));
    
    alert('Assessment saved successfully! You can view it in the History Scan section.');
  };

  const downloadResult = () => {
    const sScore = calcSymptomsPoints();
    const lScore = calcLifestylePoints();
    const eScore = calcEnvPoints();
    const mScore = calcMucusPoints();
    const finalScore = calcFinalScore();
    const classification = getClassification();
    const now = new Date();

    let report = `S.A.F.E. — Sinus Risk Assessment Report\n`;
    report += `========================================\n`;
    report += `Date: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    report += `Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    report += `CLASSIFICATION: ${classification}\n`;
    report += `FINAL SCORE: ${finalScore} / 195\n\n`;
    report += `--- Scores ---\n`;
    report += `Clinical Symptoms:    ${sScore} / 150\n`;
    report += `Lifestyle Factors:     ${lScore} / 15\n`;
    report += `Environmental Factors: ${eScore} / 28\n`;
    if (answers.mucusResult) {
      const finalMucusLabel = answers.mucusResult.isGreyZone && answers.mucusColor 
        ? answers.mucusColor.label 
        : answers.mucusResult.detectedColor.label;
      report += `Mucus Color Scan:      ${mScore} / 2 (${finalMucusLabel})\n`;
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

  const symptomsScore = calcSymptomsPoints();
  const lifestyleScore = calcLifestylePoints();
  const envScore = calcEnvPoints();
  const mucusScore = calcMucusPoints();
  const finalScore = calcFinalScore();
  const classification = getClassification();

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
      {/* Progress bar at top */}
      <div className="risk-progress-top">
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="progress-text">{Math.round(progressPercentage)}% Complete</div>
      </div>

      {/* Sidebar + Content Layout */}
      <div className="risk-body">
        {/* Sidebar Steps */}
        <div className="risk-sidebar">
          <div className="steps-indicator">
            {STEPS.map((s, i) => (
              <div 
                key={i} 
                className={`step-item ${step > i ? 'completed' : ''} ${step === i + 1 ? 'current' : ''}`}
                onClick={() => setStep(i + 1)}
              >
                <div className="step-number">{i + 1}</div>
                <div className="step-label">{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
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
              {/* Classification Banner */}
              <div className="classification-banner card" style={{
                backgroundColor: getClassificationColor() + '15',
                borderColor: getClassificationColor(),
                borderWidth: '2px',
                borderStyle: 'solid',
                textAlign: 'center',
                padding: '2rem 1rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>Classification</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: getClassificationColor(), margin: '0.5rem 0' }}>
                  {classification}
                </div>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)', fontSize: '1.1rem' }}>Final Score: {finalScore} / 195</p>
              </div>

              <div className="scores-breakdown">
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Clinical Symptoms</h4>
                    <span className="score-badge" style={{backgroundColor: 'var(--primary)', color: 'white'}}>{symptomsScore} / 150</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${(symptomsScore/150)*100}%`, backgroundColor: 'var(--primary)'}}></div></div>
                </div>
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Lifestyle Factors</h4>
                    <span className="score-badge" style={{backgroundColor: 'var(--primary)', color: 'white'}}>{lifestyleScore} / 15</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${(lifestyleScore/15)*100}%`, backgroundColor: 'var(--primary)'}}></div></div>
                </div>
                <div className="score-card card">
                  <div className="score-header">
                    <h4>Environmental Factors</h4>
                    <span className="score-badge" style={{backgroundColor: 'var(--primary)', color: 'white'}}>{envScore} / 28</span>
                  </div>
                  <div className="progress-container"><div className="progress-bar" style={{width: `${(envScore/28)*100}%`, backgroundColor: 'var(--primary)'}}></div></div>
                </div>
                {answers.mucusResult && (
                  <div className="score-card card">
                    <div className="score-header">
                      <h4>Mucus Color Scan</h4>
                      <span className="score-badge" style={{backgroundColor: 'var(--primary)', color: 'white'}}>{mucusScore} / 2</span>
                    </div>
                    <div className="progress-container"><div className="progress-bar" style={{width: `${(mucusScore/2)*100}%`, backgroundColor: 'var(--primary)'}}></div></div>
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
      </div>{/* end risk-body */}
    </div>
  );
};

export default RiskAssessmentModal;

