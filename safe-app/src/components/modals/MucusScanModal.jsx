import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Droplet, X, AlertTriangle, Info, CheckCircle, Search, ChevronDown, RefreshCw } from 'lucide-react';
import './MucusScanModal.css';

import { MUCUS_COLORS, analyzeMucusColorImage } from './MucusLogic';

const MucusScanModal = () => {
  // --- State ---
  const [selectedColor, setSelectedColor] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [mucusPreview, setMucusPreview] = useState(null);
  const [mucusAnalysis, setMucusAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const canvasRef = useRef(null);
  const dropdownRef = useRef(null);

  // --- Handlers ---
  const handleSelectColor = (color) => {
    setSelectedColor(color);
    setShowColorDropdown(false);
    setScanError(null);
    // Reset analysis when color changes
    if (mucusAnalysis) {
      setMucusAnalysis(null);
    }
  };

  const handleMucusUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Please upload a valid image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setScanError('Image file is too large. Please use an image under 20MB.');
      return;
    }
    setImageFile(file);
    setMucusPreview(URL.createObjectURL(file));
    setScanError(null);
    // Reset analysis when image changes
    if (mucusAnalysis) {
      setMucusAnalysis(null);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) handleMucusUpload(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleMucusUpload(e.dataTransfer.files[0]);
  };

  const removeMucusImage = () => {
    setMucusPreview(null);
    setImageFile(null);
    setMucusAnalysis(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleScanNow = async () => {
    // Validation
    if (!selectedColor) {
      setScanError('Please select your mucus color first.');
      return;
    }
    if (!imageFile) {
      setScanError('Please upload a mucus photo first.');
      return;
    }

    setScanError(null);
    setIsAnalyzing(true);
    setMucusAnalysis(null);

    try {
      const result = await analyzeMucusColorImage(imageFile, selectedColor);

      if (!result || !result.detectedColor) {
        throw new Error('Analysis returned no results. Please try a different image.');
      }

      setMucusAnalysis(result);
    } catch (err) {
      setScanError(err.message || 'Scan failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedColor(null);
    setImageFile(null);
    setMucusPreview(null);
    setMucusAnalysis(null);
    setIsAnalyzing(false);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getSeverityClass = (riskScore) => {
    if (riskScore <= 1) return 'success';
    if (riskScore <= 2) return 'warning';
    return 'danger';
  };

  const canScan = selectedColor && imageFile && !isAnalyzing;

  return (
    <div className="mucus-modal">
      {/* Header */}
      <div className="mucus-modal-header">
        <Droplet size={28} className="mucus-modal-icon" />
        <div>
          <h2>Mucus Color Scan</h2>
          <p>Analyze your nasal mucus color to get health insights and recommendations.</p>
        </div>
      </div>

      <canvas ref={canvasRef} style={{display:'none'}} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{display:'none'}}
        id="mucus-standalone-file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        style={{display:'none'}}
        id="mucus-standalone-camera"
      />

      {/* Error Banner */}
      {scanError && (
        <div className="ms-error-banner">
          <AlertTriangle size={18} />
          <p>{scanError}</p>
          <button className="ms-error-close" onClick={() => setScanError(null)} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ==================== STEP 1: Color Selection ==================== */}
      <div className="ms-step">
        <div className="ms-step-header">
          <div className={`ms-step-number ${selectedColor ? 'completed' : ''}`}>
            {selectedColor ? <CheckCircle size={18} /> : '1'}
          </div>
          <div className="ms-step-title">
            <h3>What is the color of your mucus?</h3>
            <p>Select the color that best matches your nasal mucus.</p>
          </div>
        </div>

        {/* Color Dropdown Trigger */}
        <div className="ms-color-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`ms-color-dropdown-trigger ${selectedColor ? 'has-value' : ''} ${showColorDropdown ? 'open' : ''}`}
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            type="button"
          >
            {selectedColor ? (
              <div className="ms-dropdown-selected">
                <span
                  className="ms-dropdown-swatch"
                  style={{
                    backgroundColor: selectedColor.color,
                    border: selectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                  }}
                />
                <span className="ms-dropdown-label">{selectedColor.label}</span>
                <span className={`ms-dropdown-severity ${getSeverityClass(selectedColor.riskScore)}`}>
                  {selectedColor.severity}
                </span>
              </div>
            ) : (
              <span className="ms-dropdown-placeholder">
                <Droplet size={18} />
                Choose mucus color...
              </span>
            )}
            <ChevronDown size={20} className={`ms-dropdown-chevron ${showColorDropdown ? 'rotated' : ''}`} />
          </button>

          {/* Dropdown Options */}
          {showColorDropdown && (
            <div className="ms-color-dropdown-menu">
              {MUCUS_COLORS.map(mc => (
                <button
                  key={mc.id}
                  className={`ms-color-option ${selectedColor?.id === mc.id ? 'selected' : ''}`}
                  onClick={() => handleSelectColor(mc)}
                  type="button"
                >
                  <span
                    className="ms-option-swatch"
                    style={{
                      backgroundColor: mc.color,
                      color: mc.textColor,
                      border: mc.id === 'clear' ? '2px solid var(--border)' : 'none'
                    }}
                  >
                    <Droplet size={14} />
                  </span>
                  <div className="ms-option-text">
                    <span className="ms-option-label">{mc.label}</span>
                    <span className="ms-option-desc">{mc.severity}</span>
                  </div>
                  {selectedColor?.id === mc.id && <CheckCircle size={18} className="ms-option-check" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== STEP 2: Image Upload ==================== */}
      <div className="ms-step">
        <div className="ms-step-header">
          <div className={`ms-step-number ${mucusPreview ? 'completed' : ''}`}>
            {mucusPreview ? <CheckCircle size={18} /> : '2'}
          </div>
          <div className="ms-step-title">
            <h3>Upload mucus photo</h3>
            <p>Take or upload a clear photo of your nasal mucus sample.</p>
            <div className="ms-upload-hint">
              <strong>PENTING:</strong> Pastikan sampel lendir berada tepat di <strong>tengah foto</strong> di atas tisu putih polos dengan pencahayaan yang cukup.
            </div>
          </div>
        </div>

        {!mucusPreview ? (
          <div
            className={`ms-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ms-dropzone-icon">
              <Upload size={40} />
            </div>
            <h3>Upload Mucus Photo</h3>
            <p>Drag & drop an image here, or click to browse</p>
            <div className="ms-dropzone-buttons">
              <button
                className="btn btn-primary"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload size={18} /> Choose File
              </button>
              <button
                className="btn btn-secondary"
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              >
                <Camera size={18} /> Take Photo
              </button>
            </div>
          </div>
        ) : (
          <div className="ms-preview-container">
            <div className="ms-preview-image-wrapper">
              <img src={mucusPreview} alt="Mucus sample" className="ms-preview-image" />
              <button className="ms-remove-btn" onClick={removeMucusImage} title="Remove image">
                <X size={18} />
              </button>
            </div>
            <button
              className="ms-change-image-btn"
              onClick={removeMucusImage}
            >
              <RefreshCw size={16} /> Change Photo
            </button>
          </div>
        )}
      </div>

      {/* ==================== STEP 3: Scan Now ==================== */}
      <div className="ms-scan-section">
        <button
          className={`btn btn-primary btn-lg ms-scan-btn ${!canScan ? 'disabled' : ''}`}
          onClick={handleScanNow}
          disabled={!canScan}
        >
          {isAnalyzing ? (
            <>
              <div className="ms-btn-spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <Search size={22} />
              Scan Now
            </>
          )}
        </button>

        {!selectedColor && !imageFile && (
          <p className="ms-scan-hint">Select mucus color and upload a photo to start scanning.</p>
        )}
        {selectedColor && !imageFile && (
          <p className="ms-scan-hint">Upload a mucus photo to continue.</p>
        )}
        {!selectedColor && imageFile && (
          <p className="ms-scan-hint">Select your mucus color to continue.</p>
        )}
      </div>

      {/* ==================== Loading State ==================== */}
      {isAnalyzing && (
        <div className="ms-loading-card card">
          <div className="ms-loading-content">
            <div className="ms-spinner-large" />
            <div className="ms-loading-text">
              <h4>Analyzing your mucus sample...</h4>
              <p>Processing image data and detecting color patterns.</p>
            </div>
          </div>
          <div className="ms-loading-bar-wrapper">
            <div className="ms-loading-bar" />
          </div>
        </div>
      )}

      {/* ==================== STEP 4: Results ==================== */}
      {mucusAnalysis && !isAnalyzing && (
        <div className="ms-results-section">
          <div className="ms-results-title">
            <CheckCircle size={22} className="ms-results-icon" />
            <h3>Scan Results</h3>
          </div>

          {/* Summary Cards Row */}
          <div className="ms-summary-row">
            {/* User Selected Color */}
            <div className="ms-summary-card card">
              <span className="ms-summary-label">Your Selection</span>
              <div className="ms-summary-value">
                <span
                  className="ms-summary-swatch"
                  style={{
                    backgroundColor: selectedColor.color,
                    border: selectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                  }}
                />
                <span>{selectedColor.label}</span>
              </div>
            </div>

            {/* Detected Color */}
            <div className="ms-summary-card card">
              <span className="ms-summary-label">Detected Color</span>
              <div className="ms-summary-value">
                <span
                  className="ms-summary-swatch"
                  style={{
                    backgroundColor: mucusAnalysis.detectedColor.color,
                    border: mucusAnalysis.detectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                  }}
                />
                <span>{mucusAnalysis.detectedColor.label}</span>
              </div>
            </div>
          </div>

          {/* Analyzed Image */}
          <div className="ms-result-image-card card">
            <span className="ms-summary-label">Analyzed Image</span>
            <div className="ms-result-image-wrapper">
              <img src={mucusPreview} alt="Analyzed mucus sample" className="ms-result-image" />
            </div>
          </div>

          {/* Main Analysis Result */}
          <div className="ms-result card">
            <div className="ms-result-header">
              <div
                className="ms-color-swatch"
                style={{
                  backgroundColor: mucusAnalysis.detectedColor.color,
                  border: mucusAnalysis.detectedColor.id === 'clear' ? '2px solid var(--border)' : 'none'
                }}
              ></div>
              <div className="ms-result-info">
                <div className="ms-result-title-row">
                  <h3>{mucusAnalysis.detectedColor.label}</h3>
                  {mucusAnalysis.confidence && (
                    <span className={`ms-confidence-badge confidence-${mucusAnalysis.confidence.toLowerCase()}`}>
                      {mucusAnalysis.confidence} Confidence
                    </span>
                  )}
                </div>
                <span className={`score-badge ${getSeverityClass(mucusAnalysis.detectedColor.riskScore)}`}>
                  {mucusAnalysis.detectedColor.severity}
                </span>
              </div>
            </div>

            <div className="ms-result-body">
              <div className="ms-result-block">
                <h4>Analysis</h4>
                <p className="ms-description">{mucusAnalysis.detectedColor.description}</p>
              </div>

              <div className="ms-advice">
                <Info size={16} />
                <div>
                  <h4>Recommendation</h4>
                  <p>{mucusAnalysis.detectedColor.advice}</p>
                </div>
              </div>
            </div>
          </div>

          {mucusAnalysis.confidence === 'Low' && (
            <div className="ms-low-confidence-warning">
              <AlertTriangle size={18} />
              <p>Hasil kurang jelas — coba ambil ulang foto dengan pencahayaan lebih baik, pastikan lendir berada di tengah, atau pastikan pilihan manual sudah sesuai.</p>
            </div>
          )}

          {/* Scan Again */}
          <button className="btn btn-outline ms-reset-btn" onClick={handleReset}>
            <RefreshCw size={18} /> Scan Again
          </button>
        </div>
      )}

      {/* Color Reference Guide */}
      <div className="ms-color-guide card">
        <h3><Info size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'0.5rem'}} />Mucus Color Reference Guide</h3>
        <div className="ms-guide-grid">
          {MUCUS_COLORS.map(mc => (
            <div key={mc.id} className="ms-guide-item">
              <div
                className="ms-guide-swatch"
                style={{
                  backgroundColor: mc.color,
                  color: mc.textColor,
                  border: mc.id === 'clear' ? '2px solid var(--border)' : 'none'
                }}
              >
                <Droplet size={16} />
              </div>
              <div className="ms-guide-text">
                <strong>{mc.label}</strong>
                <span className="ms-guide-severity">{mc.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ms-disclaimer">
        <AlertTriangle size={16} />
        <p>This color analysis is based on average pixel detection and is for screening purposes only. Lighting conditions may affect accuracy. Always consult a healthcare professional for proper diagnosis.</p>
      </div>

      <div className="ms-footer">
        <p>"This result is for screening purposes only and is not a medical diagnosis."</p>
        <p>Source: Cleveland Clinic — What the Color of Your Snot Really Means (2024)</p>
      </div>
    </div>
  );
};

export default MucusScanModal;
