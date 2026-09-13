import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

export default function FileUpload({ file, onFileSelect, onFileRemove, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(selectedFile.type)) {
      alert('Invalid file format. Please upload a PDF, PNG, or JPEG file.');
      return;
    }

    if (selectedFile.size > maxSize) {
      alert('File size exceeds the 5MB limit. Please choose a smaller file.');
      return;
    }

    onFileSelect(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="form-group">
      <div className="form-label">
        <span>Aadhaar Document Copy <span className="label-req">*</span></span>
        <span className="label-hint">PDF, JPG, or PNG (Max 5MB)</span>
      </div>

      {!file ? (
        <div
          className={`file-dropzone ${isDragging ? 'dragging' : ''} ${error ? 'has-error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".pdf,image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
          />

          <div className="dropzone-content">
            <div className="dropzone-icon">
              <UploadCloud size={24} />
            </div>
            <div className="dropzone-title">Click to upload or drag & drop</div>
            <div className="dropzone-desc">Front & back Aadhaar card copy or e-Aadhaar PDF</div>
          </div>
        </div>
      ) : (
        <div className="file-preview-box">
          <div className="file-info">
            <div className="file-badge">
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div className="file-meta">
              <div className="file-name" title={file.name}>{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}</div>
            </div>
          </div>

          <button
            type="button"
            className="file-remove-btn"
            onClick={onFileRemove}
            title="Remove document"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="input-error-msg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
