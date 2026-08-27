import React from 'react';
import './Hero.css';
import { Wind, HeartPulse } from 'lucide-react';

const Hero = ({ openModal }) => {
  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">S.A.F.E.</div>
          <h1>Sinus Assessment & Prevention Ecosystem</h1>
          <p className="hero-description">
            An intelligent digital health system designed to assess sinus-related symptoms and environmental risk factors. By integrating health screening with environmental and lifestyle assessments, S.A.F.E. helps users identify potential sinus-related risks and provides personalized preventive recommendations to support better nasal and respiratory health.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => openModal('risk')}>
              CHECK MY RISK
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>
        
        <div className="hero-visual animate-fade-in">
          <div className="visual-circle main-circle glass">
            {/* Logo in the center of the visual circle */}
            <img src="/logo.png" alt="S.A.F.E. Logo" className="visual-logo" />
            <div className="floating-badge badge-1 glass">
              <Wind size={20} className="text-primary" />
              <span>Airflow</span>
            </div>
            <div className="floating-badge badge-2 glass">
              <HeartPulse size={20} className="text-danger" />
              <span>Health</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
