import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Activity, Clock } from 'lucide-react';
import './HistoryScanModal.css';

const HistoryScanModal = () => {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('sinus_assessment_history');
    if (saved) {
      setHistoryData(JSON.parse(saved));
    }
  }, []);

  const getRiskColor = (level) => {
    switch(level) {
      case 'Low Risk':
      case 'Low': return 'var(--success)';
      case 'Moderate Risk':
      case 'Moderate': return 'var(--warning)';
      case 'High Risk':
      case 'High': return 'var(--danger)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="history-modal">
      <div className="history-header text-center">
        <h2>Your Assessment History</h2>
        <p className="text-light">Review your past sinus risk screenings to track your progress.</p>
      </div>

      <div className="timeline-container">
        {historyData.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-light)' }}>
            <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>No History Found</h3>
            <p>You haven't taken any assessments yet. Take the "Check My Risk" assessment to see your results here.</p>
          </div>
        ) : (
          historyData.map((entry, index) => (
            <div key={entry.id} className="timeline-item animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="timeline-marker"></div>
              <div className="timeline-content card">
                <div className="timeline-card-header">
                  <div className="datetime">
                    <span className="date"><Calendar size={16} /> {entry.date}</span>
                    <span className="time"><Clock size={16} /> {entry.time}</span>
                  </div>
                  <div className="risk-badge" style={{ backgroundColor: `${getRiskColor(entry.riskLevel)}20`, color: getRiskColor(entry.riskLevel) }}>
                    <Activity size={16} /> {entry.riskLevel}
                  </div>
                </div>

                <div className="scores-grid">
                  <div className="score-item">
                    <span className="score-label">Symptoms</span>
                    <div className="progress-container"><div className="progress-bar" style={{ width: `${entry.scores.symptoms}%` }}></div></div>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Lifestyle</span>
                    <div className="progress-container"><div className="progress-bar" style={{ width: `${entry.scores.lifestyle}%` }}></div></div>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Environment</span>
                    <div className="progress-container"><div className="progress-bar" style={{ width: `${entry.scores.environmental}%` }}></div></div>
                  </div>
                </div>

                <div className="timeline-card-footer">
                  <button className="btn btn-outline btn-sm">
                    View Details <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryScanModal;
