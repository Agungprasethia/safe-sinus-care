import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react';
import './BreathingModal.css';

const TECHNIQUES = {
  box: {
    id: 'box',
    name: 'Box Breathing (4-4-4-4)',
    description: 'Inhale for 4s, Hold for 4s, Exhale for 4s, Hold for 4s. Helps clear your mind, relax your body, and improve focus.',
    cycle: [
      { phase: 'INHALE', duration: 4 },
      { phase: 'HOLD', duration: 4 },
      { phase: 'EXHALE', duration: 4 },
      { phase: 'HOLD', duration: 4 }
    ],
    totalCycles: 4
  },
  relax: {
    id: 'relax',
    name: 'Relaxation Breathing (4-7-8)',
    description: 'Inhale for 4s, Hold for 7s, Exhale for 8s. A natural tranquilizer for the nervous system that promotes deep relaxation.',
    cycle: [
      { phase: 'INHALE', duration: 4 },
      { phase: 'HOLD', duration: 7 },
      { phase: 'EXHALE', duration: 8 }
    ],
    totalCycles: 4
  },
  equal: {
    id: 'equal',
    name: 'Equal Breathing (4-4)',
    description: 'Inhale for 4s, Exhale for 4s. Helps calm the nervous system, increase focus, and reduce stress.',
    cycle: [
      { phase: 'INHALE', duration: 4 },
      { phase: 'EXHALE', duration: 4 }
    ],
    totalCycles: 5
  }
};

const BreathingModal = () => {
  const [selectedTech, setSelectedTech] = useState('box');
  const [exerciseState, setExerciseState] = useState('READY'); // READY, RUNNING, PAUSED, COMPLETED
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phaseDuration, setPhaseDuration] = useState(0);
  
  const intervalRef = useRef(null);

  const technique = TECHNIQUES[selectedTech];

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetExercise = useCallback(() => {
    stopTimer();
    setExerciseState('READY');
    setCurrentPhaseIndex(0);
    setCurrentCycle(1);
    setTimeRemaining(0);
    setPhaseDuration(0);
  }, [stopTimer]);

  const handleTechChange = (e) => {
    setSelectedTech(e.target.value);
    resetExercise();
  };

  // Core timer tick — this runs every second when active
  const startTimer = useCallback(() => {
    stopTimer();
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this phase — advance
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Advance to next phase when timeRemaining hits 0 during RUNNING
  useEffect(() => {
    if (exerciseState !== 'RUNNING' || timeRemaining > 0) return;

    // Need to advance to next phase
    const tech = TECHNIQUES[selectedTech];
    const isLastPhase = currentPhaseIndex >= tech.cycle.length - 1;

    if (isLastPhase) {
      if (currentCycle >= tech.totalCycles) {
        // All done!
        stopTimer();
        setExerciseState('COMPLETED');
        return;
      }
      // Next cycle, first phase
      const nextDuration = tech.cycle[0].duration;
      setCurrentCycle(c => c + 1);
      setCurrentPhaseIndex(0);
      setTimeRemaining(nextDuration);
      setPhaseDuration(nextDuration);
    } else {
      // Next phase in same cycle
      const nextIdx = currentPhaseIndex + 1;
      const nextDuration = tech.cycle[nextIdx].duration;
      setCurrentPhaseIndex(nextIdx);
      setTimeRemaining(nextDuration);
      setPhaseDuration(nextDuration);
    }
  }, [timeRemaining, exerciseState, currentPhaseIndex, currentCycle, selectedTech, stopTimer]);

  const toggleTimer = () => {
    if (exerciseState === 'READY') {
      const firstDuration = technique.cycle[0].duration;
      setExerciseState('RUNNING');
      setCurrentPhaseIndex(0);
      setCurrentCycle(1);
      setTimeRemaining(firstDuration);
      setPhaseDuration(firstDuration);
      // Start interval in next tick after state updates
      setTimeout(() => startTimer(), 0);
    } else if (exerciseState === 'RUNNING') {
      setExerciseState('PAUSED');
      stopTimer();
    } else if (exerciseState === 'PAUSED') {
      setExerciseState('RUNNING');
      startTimer();
    }
  };

  // Restart timer when phase advances during running
  useEffect(() => {
    if (exerciseState === 'RUNNING' && timeRemaining > 0 && !intervalRef.current) {
      startTimer();
    }
  }, [exerciseState, timeRemaining, startTimer]);

  // Display values
  let displayPhase = 'READY TO START';
  let animationClass = '';
  let phaseColor = 'var(--primary)';

  if (exerciseState === 'COMPLETED') {
    displayPhase = 'WELL DONE!';
    phaseColor = 'var(--success)';
  } else if (exerciseState === 'RUNNING' || exerciseState === 'PAUSED') {
    const currentPhase = technique.cycle[currentPhaseIndex];
    displayPhase = currentPhase.phase;
    animationClass = displayPhase.toLowerCase();

    if (displayPhase === 'INHALE') phaseColor = '#3B82F6';
    else if (displayPhase === 'HOLD') phaseColor = '#F59E0B';
    else if (displayPhase === 'EXHALE') phaseColor = '#10B981';
  }

  // Progress ring calculations
  const progressFraction = phaseDuration > 0 ? (phaseDuration - timeRemaining) / phaseDuration : 0;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - (progressFraction * circumference);

  // Overall progress
  const totalPhases = technique.cycle.length * technique.totalCycles;
  const completedPhases = ((currentCycle - 1) * technique.cycle.length) + currentPhaseIndex;
  const overallProgress = exerciseState === 'COMPLETED' ? 100 : Math.round((completedPhases / totalPhases) * 100);

  return (
    <div className="breathing-modal">
      <div className="breathing-header text-center">
        <h2>Breathing Training</h2>
        <p className="text-light">Practice these structured breathing techniques to promote relaxed breathing and comfortable nasal airflow.</p>
      </div>

      <div className="technique-selector card">
        <div className="select-wrapper">
          <select value={selectedTech} onChange={handleTechChange} disabled={exerciseState === 'RUNNING' || exerciseState === 'PAUSED'}>
            {Object.values(TECHNIQUES).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="select-icon" size={20} />
        </div>
        <p className="technique-desc text-light">{technique.description}</p>
      </div>

      {/* Overall progress bar */}
      {exerciseState !== 'READY' && (
        <div className="overall-progress">
          <div className="overall-progress-bar-container">
            <div className="overall-progress-bar" style={{ width: `${overallProgress}%`, backgroundColor: phaseColor }}></div>
          </div>
          <span className="overall-progress-text">{overallProgress}% • Cycle {currentCycle} of {technique.totalCycles}</span>
        </div>
      )}

      <div className="breathing-circle-container">
        <div className={`breathing-circle ${animationClass} ${exerciseState === 'PAUSED' ? 'paused' : ''}`}
          style={{ '--phase-duration': `${phaseDuration}s`, '--phase-color': phaseColor }}>
          
          {/* SVG progress ring */}
          <svg className="progress-ring" viewBox="0 0 260 260">
            <circle className="progress-ring-bg" cx="130" cy="130" r="110" />
            <circle
              className="progress-ring-fill"
              cx="130" cy="130" r="110"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                stroke: phaseColor,
                transition: exerciseState === 'RUNNING' ? 'stroke-dashoffset 1s linear' : 'none'
              }}
            />
          </svg>
          
          <div className="circle-content">
            <span className="phase-text" style={{ color: phaseColor }}>{displayPhase}</span>
            {(exerciseState === 'RUNNING' || exerciseState === 'PAUSED') && (
              <>
                <span className="timer-text">{timeRemaining}</span>
                <span className="timer-label">seconds</span>
              </>
            )}
            {exerciseState === 'COMPLETED' && (
              <span className="completed-subtext">Great job breathing!</span>
            )}
          </div>
        </div>
      </div>

      {/* Phase indicator dots */}
      {exerciseState !== 'READY' && exerciseState !== 'COMPLETED' && (
        <div className="phase-indicators">
          {technique.cycle.map((p, i) => (
            <div key={i} className={`phase-dot ${i === currentPhaseIndex ? 'active' : ''} ${i < currentPhaseIndex ? 'done' : ''}`}>
              <span className="phase-dot-label">{p.phase}</span>
              <span className="phase-dot-time">{p.duration}s</span>
            </div>
          ))}
        </div>
      )}

      <div className="breathing-controls flex justify-center gap-4">
        {exerciseState === 'READY' && (
          <button className="btn btn-primary btn-lg w-48" onClick={toggleTimer}>
            <Play size={20} /> START
          </button>
        )}
        
        {exerciseState === 'RUNNING' && (
          <button className="btn btn-warning btn-lg w-48" onClick={toggleTimer}>
            <Pause size={20} /> PAUSE
          </button>
        )}

        {exerciseState === 'PAUSED' && (
          <>
            <button className="btn btn-primary btn-lg" onClick={toggleTimer}>
              <Play size={20} /> RESUME
            </button>
            <button className="btn btn-outline btn-lg" onClick={resetExercise}>
              <RotateCcw size={20} /> RESET
            </button>
          </>
        )}

        {exerciseState === 'COMPLETED' && (
          <button className="btn btn-primary btn-lg w-48" onClick={resetExercise}>
            <RotateCcw size={20} /> START AGAIN
          </button>
        )}
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

export default BreathingModal;
