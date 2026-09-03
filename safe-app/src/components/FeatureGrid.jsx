import React from 'react';
import './FeatureGrid.css';
import { Stethoscope, History, MessageSquare, BookOpen, Apple, Wind, Activity, Droplet, MapPin } from 'lucide-react';

const features = [
  {
    id: 'risk',
    title: 'CHECK MY RISK',
    description: 'Assess sinus symptoms, lifestyle factors, and environmental risk factors.',
    icon: <Stethoscope size={32} />
  },
  {
    id: 'history',
    title: 'CHECK HISTORY SCAN',
    description: 'Review previous sinus assessments.',
    icon: <History size={32} />
  },
  {
    id: 'chatbot',
    title: 'CONSULT CHATBOT AI',
    description: 'Chat with an intelligent sinus health assistant.',
    icon: <MessageSquare size={32} />
  },
  {
    id: 'mucus',
    title: 'MUCUS COLOR SCAN',
    description: 'Upload a photo of your nasal mucus to analyze its color and get health insights.',
    icon: <Droplet size={32} />
  },
  {
    id: 'workout',
    title: 'NASAL WORKOUT',
    description: 'Exercises supporting comfortable nasal breathing.',
    icon: <Wind size={32} />
  },
  {
    id: 'breathing',
    title: 'BREATHING TRAINING',
    description: 'Guided breathing exercises.',
    icon: <Activity size={32} />
  },
  {
    id: 'hospital',
    title: 'FIND NEARBY HOSPITAL',
    description: 'Locate hospitals and clinics near you for sinus care and emergencies.',
    icon: <MapPin size={32} />
  }
];

const FeatureGrid = ({ openModal }) => {
  return (
    <section className="features-section">
      <div className="container">
        <div className="features-header text-center">
          <h2>Comprehensive Sinus Care</h2>
          <p>Explore our premium tools designed to help you breathe better.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              className={`feature-card ${index === 0 ? 'featured-card' : ''}`}
              onClick={() => openModal(feature.id)}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
