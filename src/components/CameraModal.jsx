import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertCircle, UploadCloud } from 'lucide-react';
import './CameraModal.css';

export default function CameraModal({ isOpen, onClose, onCapture, onFallbackToNativeCamera }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [error, setError] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check for available video devices
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Start video stream when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setError(null);
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      let msg = 'Could not access camera. Please check permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      }
      setError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle front/back camera
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Snap photo frame to canvas
  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image back to natural orientation
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedDataUrl(dataUrl);
      },
      'image/jpeg',
      0.92
    );
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
  };

  // Confirm photo and return file
  const handleConfirm = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `student_photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    onCapture(file);
    stopCamera();
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        {/* Header */}
        <div className="camera-modal-header">
          <div className="camera-modal-title">
            <Camera size={20} color="#fbbf24" />
            <span>Take Student Passport Photo</span>
          </div>
          <button type="button" className="camera-close-btn" onClick={handleClose} title="Close Camera">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="camera-viewport">
          {!error ? (
            !capturedDataUrl ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`camera-video ${facingMode === 'environment' ? 'rear-camera' : ''}`}
                />
                {/* Passport Frame Guide */}
                <div className="camera-face-guide">
                  <span className="camera-guide-text">Align face inside oval</span>
                </div>
              </>
            ) : (
              <img src={capturedDataUrl} alt="Captured Student Photo" className="camera-preview-img" />
            )
          ) : (
            <div className="camera-error-box">
              <div className="camera-error-icon">
                <AlertCircle size={28} />
              </div>
              <p className="camera-error-msg">{error}</p>
              {typeof onFallbackToNativeCamera === 'function' && (
                <button
                  type="button"
                  className="camera-action-btn btn-confirm"
                  onClick={() => {
                    handleClose();
                    onFallbackToNativeCamera();
                  }}
                  style={{ marginTop: 8 }}
                >
                  <Camera size={16} />
                  <span>Open Phone Camera App</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="camera-modal-footer">
          {/* Left: Switch Camera or Cancel */}
          <div>
            {!capturedDataUrl && !error && hasMultipleCameras && (
              <button
                type="button"
                className="camera-action-btn"
                onClick={handleToggleCamera}
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw size={16} />
                <span>Flip</span>
              </button>
            )}

            {capturedDataUrl && (
              <button
                type="button"
                className="camera-action-btn btn-retake"
                onClick={handleRetake}
              >
                <RotateCcw size={16} />
                <span>Retake</span>
              </button>
            )}
          </div>

          {/* Center: Shutter Button */}
          <div className="camera-shutter-container">
            {!capturedDataUrl && !error && (
              <button
                type="button"
                className="camera-shutter-btn"
                onClick={handleSnap}
                title="Snap Photo"
              >
                <div className="camera-shutter-inner"></div>
              </button>
            )}
          </div>

          {/* Right: Confirm Button or Close */}
          <div>
            {capturedDataUrl ? (
              <button
                type="button"
                className="camera-action-btn btn-confirm"
                onClick={handleConfirm}
              >
                <Check size={16} />
                <span>Use Photo</span>
              </button>
            ) : (
              <button
                type="button"
                className="camera-action-btn"
                onClick={handleClose}
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
