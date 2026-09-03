import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeatureGrid from './components/FeatureGrid';
import ModalWrapper from './components/modals/ModalWrapper';

// Modal Components to be imported
import RiskAssessmentModal from './components/modals/RiskAssessmentModal';
import HistoryScanModal from './components/modals/HistoryScanModal';
import ChatbotModal from './components/modals/ChatbotModal';
import ArticlesModal from './components/modals/ArticlesModal';
import FoodGuideModal from './components/modals/FoodGuideModal';
import WorkoutModal from './components/modals/WorkoutModal';
import BreathingModal from './components/modals/BreathingModal';
import MucusScanModal from './components/modals/MucusScanModal';

function App() {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalId) => {
    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'risk': return <RiskAssessmentModal />;
      case 'history': return <HistoryScanModal />;
      case 'chatbot': return <ChatbotModal />;
      case 'workout': return <WorkoutModal />;
      case 'breathing': return <BreathingModal />;
      case 'mucus': return <MucusScanModal />;
      default: return null;
    }
  };

  return (
    <>
      <Navbar openModal={openModal} />
      <main>
        <Hero openModal={openModal} />
        <section id="features-section">
          <FeatureGrid openModal={openModal} />
        </section>
        <section className="container" style={{ padding: '2rem 0.5rem' }} id="food-guide-section">
          <FoodGuideModal />
        </section>
        <section className="container" style={{ padding: '2rem 0.5rem' }} id="articles-section">
          <ArticlesModal />
        </section>
      </main>
      
      <ModalWrapper isOpen={activeModal !== null} onClose={closeModal}>
        {renderModalContent()}
      </ModalWrapper>
    </>
  );
}

export default App;
