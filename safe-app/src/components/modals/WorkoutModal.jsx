import React, { useState, useEffect } from 'react';
import { Wind, Activity, Hand, Play, Square, AlertTriangle } from 'lucide-react';
import './WorkoutModal.css';

const WORKOUTS = [
  {
    step: 1,
    title: "Diaphragmatic Breathing",
    duration: 60, // seconds
    icon: <Activity size={32} />,
    instructions: "Place one hand on your belly. Breathe in slowly through your nose, letting your belly push your hand out. Breathe out through pursed lips."
  },
  {
    step: 2,
    title: "Nasal Breathing",
    duration: 120,
    icon: <Wind size={32} />,
    instructions: "Close your mouth and breathe normally through your nose. Focus on making the breath light, slow, and deep."
  },
  {
    step: 3,
    title: "Gentle Sinus Massage",
    duration: 90,
    icon: <Hand size={32} />,
    instructions: "Using your index and middle fingers, gently apply circular pressure just above your eyebrows, then on your cheekbones."
  }
];

const WorkoutModal = () => {
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    let interval;
    if (activeTimerId !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && activeTimerId !== null) {
      setActiveTimerId(null);
    }
    return () => clearInterval(interval);
  }, [activeTimerId, timeRemaining]);

  const toggleTimer = (stepId, duration) => {
    if (activeTimerId === stepId) {
      // Stop
      setActiveTimerId(null);
      setTimeRemaining(0);
    } else {
      // Start
      setActiveTimerId(stepId);
      setTimeRemaining(duration);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="workout-modal">
      <div className="workout-header text-center">
        <h2>Nasal Workout</h2>
        <p className="text-light">Simple exercises to support nasal airflow and improve breathing comfort.</p>
      </div>

      <div className="workouts-list">
        {WORKOUTS.map((workout) => {
          const isActive = activeTimerId === workout.step;
          const displayTime = isActive ? timeRemaining : workout.duration;

          return (
            <div key={workout.step} className={`workout-card card ${isActive ? 'active-workout' : ''}`}>
              <div className="workout-icon">
                {workout.icon}
              </div>
              <div className="workout-details">
                <span className="step-badge">Step {workout.step}</span>
                <h3>{workout.title}</h3>
                <p>{workout.instructions}</p>
              </div>
              <div className="workout-controls">
                <div className="timer-display">{formatTime(displayTime)}</div>
                <button 
                  className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => toggleTimer(workout.step, workout.duration)}
                >
                  {isActive ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="safety-reminder">
        <div className="reminder-icon">
          <AlertTriangle size={24} />
        </div>
        <div className="reminder-text">
          <strong>Safety Reminder:</strong> Breathe gently and comfortably. Do not force your breathing. Stop if you feel dizzy, uncomfortable, or have difficulty breathing.
        </div>
      </div>
    </div>
  );
};

export default WorkoutModal;
