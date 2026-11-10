import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = ({ openModal }) => {
  return (
    <footer className="site-footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-title">S.A.F.E.</span>
            </div>
            <p className="footer-tagline">
              Sinus Assessment &amp; Prevention Ecosystem. Empowering respiratory wellness through intelligent screening, nutrition guidance, and non-invasive daily care.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Home</button></li>
                <li><button onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>Features</button></li>
                <li><button onClick={() => document.getElementById('food-guide-section')?.scrollIntoView({ behavior: 'smooth' })}>Food Guide</button></li>
                <li><button onClick={() => document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' })}>Articles</button></li>
                <li><button onClick={() => document.getElementById('user-guide-section')?.scrollIntoView({ behavior: 'smooth' })}>User Guide</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Interactive Tools</h4>
              <ul>
                <li><button onClick={() => openModal('risk')}>Check My Risk</button></li>
                <li><button onClick={() => openModal('history')}>History Scan</button></li>
                <li><button onClick={() => openModal('chatbot')}>Consult AI Chatbot</button></li>
                <li><button onClick={() => openModal('breathing')}>Breathing Training</button></li>
                <li><button onClick={() => openModal('workout')}>Nasal Workout</button></li>
                <li><button onClick={() => openModal('hospital')}>Find Nearby Hospital</button></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Feedback &amp; Survey</h4>
              <p className="footer-feedback-desc">
                Help us improve this platform by completing our user satisfaction questionnaire.
              </p>
              <a 
                href="https://forms.gle/wrKqFunQtgcrjDYH9" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-survey-link"
              >
                <span>Satisfaction Form</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p>
            <strong>Medical Disclaimer:</strong> S.A.F.E. is designed for informational, educational, and risk awareness purposes only. It is not intended to replace professional medical advice, clinical diagnosis, or treatment. Always consult an ENT specialist or qualified physician for persistent symptoms or emergencies.
          </p>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} S.A.F.E. All rights reserved.</p>
          <p className="footer-credit">
            Developed with care for sinus health <Heart size={14} className="heart-icon" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

