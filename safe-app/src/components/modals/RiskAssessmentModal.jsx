import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Download, RefreshCcw, Save } from 'lucide-react';
import './RiskAssessmentModal.css';

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

  const STEPS = ["Symptoms", "Lifestyle", "Environment", "Results"];
  const totalAnswered = Object.keys(answers.symptoms).length + Object.keys(answers.lifestyle).length + Object.keys(answers.environmental).length;
  const totalQuestions = SYMPTOMS.length + LIFESTYLE_QUESTIONS.length + ENVIRONMENTAL.length;
  const progressPercentage = (totalAnswered / totalQuestions) * 100;

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

  const calculateRisk = () => {
    const avg = Math.round((calcSymptomsScore() + calcLifestyleScore() + calcEnvScore()) / 3);
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
        environmental: calcEnvScore()
      }
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
    report += `Environmental Score: ${eScore}% (${getScoreLabel(eScore).label})\n\n`;
    report += `--- Symptom Answers ---\n`;
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
    setAnswers({ symptoms: {}, lifestyle: {}, environmental: {} });
  };

  const symptomsScore = calcSymptomsScore();
  const lifestyleScore = calcLifestyleScore();
  const envScore = calcEnvScore();
  const symptomsLabel = getScoreLabel(symptomsScore);
  const lifestyleLabel = getScoreLabel(lifestyleScore);
  const envLabel = getScoreLabel(envScore);

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
                disabled={Object.keys(answers.symptoms).length < SYMPTOMS.length}
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
                disabled={Object.keys(answers.lifestyle).length < LIFESTYLE_QUESTIONS.length}
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
                disabled={Object.keys(answers.environmental).length < ENVIRONMENTAL.length}
              >
                See Results <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="slide-footer text-light">
              <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
              <p>Source: University Hospitals (2024), Del Rey MD</p>
            </div>
          </div>
        )}

        {step === 4 && (
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

