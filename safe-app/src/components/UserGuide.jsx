import React from 'react';
import { ExternalLink } from 'lucide-react';
import './UserGuide.css';

const STEPS = [
  {
    number: '1',
    title: 'Check Your Sinus Risk',
    description: 'Click "CHECK MY RISK" on the home page to assess your symptoms, lifestyle, and environmental factors. You can also analyze your nasal mucus color with a photo for instant risk insights.'
  },
  {
    number: '2',
    title: 'Practice Daily Care & Diet',
    description: 'Relieve nasal congestion with guided breathing exercises and facial acupressure workouts. Explore our 7-Day Food Guide for healing meals that reduce sinus inflammation.'
  },
  {
    number: '3',
    title: 'Consult AI & Track Progress',
    description: 'Chat with our 24/7 AI assistant anytime you have questions about sinus discomfort. View your past assessment records in "CHECK HISTORY SCAN" to track your recovery over time.'
  }
];

const UserGuide = () => {
  return (
    <section className="user-guide-section">
      <div className="user-guide-header">
        <h2>How to Use This Website</h2>
        <p>Follow this simple guide to navigate our features and make the most of your sinus health care.</p>
      </div>

      <div className="user-guide-grid">
        {STEPS.map((step) => (
          <div key={step.number} className="user-guide-card card">
            <div className="step-number" aria-hidden="true">{step.number}</div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="survey-card card">
        <h3 className="survey-title">Tell Us What You Think</h3>
        <p className="survey-description">
          We would love to hear your feedback to help us improve your sinus care experience.
        </p>
        <a 
          href="https://forms.gle/wrKgFunQtgcrjDYH9" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary survey-btn"
        >
          <span>Fill Out the Satisfaction Survey</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </section>
  );
};

export default UserGuide;
