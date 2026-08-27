import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './ModalWrapper.css';

const ModalWrapper = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
