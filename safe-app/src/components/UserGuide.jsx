import React from 'react';
import { 
  Stethoscope, 
  History, 
  MessageSquare, 
  Wind, 
  Activity, 
  Utensils, 
  BookOpen, 
  MapPin, 
  ExternalLink, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import './UserGuide.css';

const STEPS = [
  {
    number: '01',
    title: 'Assess Your Sinus Risk & Mucus Color',
    icon: <Stethoscope size={24} />,
    tag: 'Screening Tool',
    description: 'Evaluate your sinus health using our multi-factor clinical screening system.',
    instructions: [
      'Click the "CHECK MY RISK" button on the home banner or feature menu.',
      'Optional: Capture or upload a photo of nasal discharge on a white tissue under good lighting for automatic mucus color and texture analysis.',
      'Select any active symptoms you are experiencing (e.g., facial pressure, nasal blockage, headache, cough).',
      'Answer quick questions regarding your sleep duration, stress levels, physical activity, and environmental exposure.',
      'Review your comprehensive risk level (Low, Mild, Moderate, or Severe) along with clinical recommendations and save or download your report.'
    ],
    actionModal: 'risk',
    actionText: 'Try Risk Assessment'
  },
  {
    number: '02',
    title: 'Monitor Assessment History',
    icon: <History size={24} />,
    tag: 'Progress Tracking',
    description: 'Track your sinus condition over time and monitor symptom changes.',
    instructions: [
      'Click "CHECK HISTORY SCAN" in the features section.',
      'View your past assessment records, risk scores, and mucus classification timestamps.',
      'Identify symptom triggers or track your recovery progress over days and weeks.'
    ],
    actionModal: 'history',
    actionText: 'View History'
  },
  {
    number: '03',
    title: 'Consult the AI Health Assistant',
    icon: <MessageSquare size={24} />,
    tag: '24/7 AI Support',
    description: 'Get instant, evidence-based answers to your sinus and respiratory questions.',
    instructions: [
      'Click "CONSULT CHATBOT AI" to start a private conversation.',
      'Ask questions about sinus remedies, medications, symptom relief at night, or when to seek emergency care.',
      'Receive structured, personalized guidance tailored to your inquiries.'
    ],
    actionModal: 'chatbot',
    actionText: 'Chat with AI'
  },
  {
    number: '04',
    title: 'Perform Daily Nasal & Breathing Exercises',
    icon: <Wind size={24} />,
    tag: 'Physical Wellness',
    description: 'Follow guided non-pharmacological routines to open airways and ease pressure.',
    instructions: [
      'Nasal Workout: Select "NASAL WORKOUT" to follow step-by-step facial acupressure massages and physical movements that loosen trapped nasal congestion.',
      'Breathing Training: Select "BREATHING TRAINING" to practice interactive pacing sessions (e.g., Box Breathing, 4-7-8, Alternate Nostril) with real-time timers to enhance nasal airflow and lung capacity.'
    ],
    actionModal: 'breathing',
    actionText: 'Start Breathing Training'
  },
  {
    number: '05',
    title: 'Follow the 7-Day Anti-Inflammatory Meal Plan',
    icon: <Utensils size={24} />,
    tag: 'Nutrition Guide',
    description: 'Support your immune system and reduce sinus inflammation through targeted nutrition.',
    instructions: [
      'Scroll to the "7-Day Food Guide" section on the main page.',
      'Switch between Day 1 to Day 7 tabs to explore recommended meals for breakfast, lunch, and dinner.',
      'Learn about key anti-inflammatory nutrients (such as Bromelain, Omega-3 fatty acids, Allicin, and Curcumin) that help thin mucus and soothe inflamed airways.'
    ],
    scrollTarget: 'food-guide-section',
    actionText: 'Go to Food Guide'
  },
  {
    number: '06',
    title: 'Learn from Sinusitis Articles & Video Guides',
    icon: <BookOpen size={24} />,
    tag: 'Educational Library',
    description: 'Enhance your knowledge with curated medical articles and practical video tutorials.',
    instructions: [
      'Browse the "Sinusitis Articles" section located directly above this guide.',
      'Watch verified video tutorials demonstrating safe saline nasal irrigation, therapeutic yoga routines, and the underlying mechanisms of sinusitis.',
      'Click "Watch Video" to view the full video guides.'
    ],
    scrollTarget: 'articles-section',
    actionText: 'Browse Articles'
  },
  {
    number: '07',
    title: 'Find Nearby Hospitals & ENT Specialists',
    icon: <MapPin size={24} />,
    tag: 'Medical Facilities',
    description: 'Quickly find medical care if your symptoms are severe or persistent.',
    instructions: [
      'Click "FIND NEARBY HOSPITAL" from the features section.',
      'Allow geolocation access or search by city to find hospitals, ENT specialists, and emergency care centers near your location.',
      'View facility contact details and obtain instant map navigation directions.'
    ],
    actionModal: 'hospital',
    actionText: 'Find Hospitals'
  }
];

const UserGuide = ({ openModal }) => {
  const handleAction = (step) => {
    if (step.actionModal && openModal) {
      openModal(step.actionModal);
    } else if (step.scrollTarget) {
      const el = document.getElementById(step.scrollTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="user-guide-container">
      {/* Header */}
      <div className="user-guide-header text-center">
        <div className="user-guide-badge">
          <BookOpen size={15} />
          <span>USER GUIDE</span>
        </div>
        <h2>How to Use This Website</h2>
        <p className="user-guide-subtitle">
          Welcome to S.A.F.E. (Sinus Assessment &amp; Prevention Ecosystem). Follow the step-by-step instructions below to make the most of our digital sinus health tools.
        </p>
      </div>

      {/* Steps List */}
      <div className="user-guide-steps">
        {STEPS.map((step) => (
          <div key={step.number} className="user-guide-step-card card">
            <div className="step-card-header">
              <div className="step-card-meta">
                <span className="step-number">{step.number}</span>
                <span className="step-tag">{step.tag}</span>
              </div>
              <div className="step-icon-wrapper">
                {step.icon}
              </div>
            </div>

            <div className="step-card-body">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
              
              <div className="step-instructions">
                <div className="step-instructions-label">
                  <Info size={14} />
                  <span>Instructions:</span>
                </div>
                <ul className="instruction-list">
                  {step.instructions.map((inst, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} className="instruction-check" />
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {step.actionText && (
                <div className="step-card-footer">
                  <button 
                    className="btn btn-outline btn-sm step-action-btn"
                    onClick={() => handleAction(step)}
                  >
                    {step.actionText}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Satisfaction Survey Card */}
      <div className="satisfaction-survey-card card">
        <div className="survey-decor-circle"></div>
        <div className="survey-content">
          <div className="survey-icon-badge">
            <Sparkles size={28} />
          </div>
          <div className="survey-text-content">
            <span className="survey-badge">WE VALUE YOUR FEEDBACK</span>
            <h3 className="survey-title">User Satisfaction Survey</h3>
            <p className="survey-description">
              Thank you for exploring S.A.F.E.! Please take 1–2 minutes to complete our short user satisfaction questionnaire. Your valuable insights and feedback help us continuously refine and improve our sinus care tools.
            </p>
          </div>
          <div className="survey-action">
            <a 
              href="https://forms.gle/wrKqFunQtgcrjDYH9" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary btn-lg survey-btn"
            >
              <span>Fill Satisfaction Form</span>
              <ExternalLink size={18} />
            </a>
            <span className="survey-note">Takes less than 2 minutes • Anonymous feedback</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
