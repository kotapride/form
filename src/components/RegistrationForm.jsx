import React, { useState, useRef, useEffect } from 'react';
import './RegistrationForm.css';
import { buildCongratulatoryMessage } from './SuccessCard';

const CLASS_OPTIONS = [
  '1st Class',
  '2nd Class',
  '3rd Class',
  '4th Class',
  '5th Class',
  '6th Class',
  '7th Class',
  '8th Class',
  '9th Class',
  '10th Class'
];

const COURSE_OPTIONS = [
  'English Development Level 1',
  'English Development Level 2',
  'English Development Level 3',
  'English Development Level 4',
  'English Development Level 5',
  'English Development Level 6',
  'English Development Level 7'
];

export default function RegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    mobileNumber: '',
    alternateMobile: '',
    studentClass: '',
    course: '',
    address: ''
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Clean up blob preview URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [filePreview, photoPreview]);

  // Handle standard text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear inline error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Restrict mobile input to numeric digits (max 10)
  const handleMobileChange = (e) => {
    const { name, value } = e.target;
    const numeric = value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, [name]: numeric }));

    if (errors[name] && numeric.length === 10) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate on blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    let msg = null;

    switch (field) {
      case 'name':
        if (!formData.name.trim()) msg = 'Name is required.';
        else if (formData.name.trim().length < 2) msg = 'Name must be at least 2 characters.';
        break;
      case 'fatherName':
        if (!formData.fatherName.trim()) msg = "Father's Name is required.";
        else if (formData.fatherName.trim().length < 2) msg = 'Must be at least 2 characters.';
        break;
      case 'mobileNumber':
        if (!formData.mobileNumber.trim()) msg = 'Mobile number is required.';
        else if (formData.mobileNumber.trim().length !== 10) msg = 'Enter a valid 10-digit mobile number.';
        break;
      case 'alternateMobile':
        if (formData.alternateMobile.trim() && formData.alternateMobile.trim().length !== 10) {
          msg = 'Enter a valid 10-digit mobile number.';
        }
        break;
      case 'studentClass':
        if (!formData.studentClass.trim()) msg = 'Please select a class.';
        break;
      case 'course':
        if (!formData.course.trim()) msg = 'Please select a course.';
        break;
      case 'address':
        if (!formData.address.trim()) msg = 'Address is required.';
        else if (formData.address.trim().length < 5) msg = 'Address must be at least 5 characters.';
        break;
      case 'photo':
        if (!photo) msg = 'Student passport-size photo is required.';
        break;
      case 'file':
        if (!file) msg = 'Aadhaar Card document (Image or PDF) is required.';
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: msg }));
    return !msg;
  };

  // Handle student photo selection (max 5MB, image only)
  const handlePhotoChange = (selectedPhoto) => {
    if (!selectedPhoto) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!validImageTypes.includes(selectedPhoto.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Invalid format. Please upload an image (JPG, PNG, WebP).'
      }));
      return;
    }

    if (selectedPhoto.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        photo: `Photo size exceeds 5MB (${(selectedPhoto.size / (1024 * 1024)).toFixed(2)}MB).`
      }));
      return;
    }

    setPhoto(selectedPhoto);
    setErrors((prev) => ({ ...prev, photo: null }));

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    const url = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(url);
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Handle file selection and validation (max 5MB, image/* or pdf)
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

    if (!validTypes.includes(selectedFile.type)) {
      setErrors((prev) => ({
        ...prev,
        file: 'Invalid format. Please upload an image (JPG, PNG, WebP) or PDF file.'
      }));
      return;
    }

    if (selectedFile.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        file: `File size exceeds 5MB (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB).`
      }));
      return;
    }

    setFile(selectedFile);
    setErrors((prev) => ({ ...prev, file: null }));

    // Show preview if image
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate all fields before submission
  const validateAll = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's Name is required.";
    else if (formData.fatherName.trim().length < 2) newErrors.fatherName = 'Must be at least 2 characters.';

    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required.';
    else if (formData.mobileNumber.trim().length !== 10) newErrors.mobileNumber = 'Enter a valid 10-digit mobile number.';

    if (formData.alternateMobile.trim() && formData.alternateMobile.trim().length !== 10) {
      newErrors.alternateMobile = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.studentClass.trim()) newErrors.studentClass = 'Please select a class.';
    if (!formData.course.trim()) newErrors.course = 'Please select a course.';

    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    else if (formData.address.trim().length < 5) newErrors.address = 'Address must be at least 5 characters.';

    if (!photo) newErrors.photo = 'Student passport-size photo is required.';
    if (!file) newErrors.file = 'Aadhaar Card document (Image or PDF) is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler using fetch with FormData (multipart) to /api/submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    setTouched({
      name: true,
      fatherName: true,
      mobileNumber: true,
      alternateMobile: true,
      studentClass: true,
      course: true,
      address: true,
      photo: true,
      file: true
    });

    if (!validateAll()) {
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('father_name', formData.fatherName.trim());
      payload.append('mobile_number', formData.mobileNumber.trim());
      if (formData.alternateMobile.trim()) {
        payload.append('alternate_mobile', formData.alternateMobile.trim());
      }
      payload.append('class', formData.studentClass.trim());
      payload.append('course', formData.course.trim());
      payload.append('address', formData.address.trim());
      payload.append('aadhar_file', file);
      payload.append('photo_file', photo);

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: payload
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Submission failed. Please verify your details.');
      }

      const resultPayload = {
        referenceId: data.submissionId,
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        alternateMobile: formData.alternateMobile.trim(),
        studentClass: formData.studentClass.trim(),
        course: formData.course.trim(),
        address: formData.address.trim(),
        fileName: file.name,
        photoName: photo.name,
        photoUrl: data.photoUrl || photoPreview,
        remotePhotoUrl: data.photoUrl,
        timestamp: data.timestamp
      };

      setSubmittedData(resultPayload);

      if (typeof onSuccess === 'function') {
        onSuccess(resultPayload);
      }
    } catch (err) {
      console.error('Registration submission error:', err);
      setApiError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      fatherName: '',
      mobileNumber: '',
      alternateMobile: '',
      studentClass: '',
      course: '',
      address: ''
    });
    handleRemoveFile();
    handleRemovePhoto();
    setErrors({});
    setTouched({});
    setApiError(null);
    setSubmittedData(null);
  };

  const handleShare = async () => {
    if (!submittedData) return;
    
    const textToShare = buildCongratulatoryMessage(submittedData);
    const photoUrl = submittedData.remotePhotoUrl || submittedData.photoUrl;

    let fileShared = false;
    if (photoUrl && navigator.share && navigator.canShare) {
      try {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const cleanName = (submittedData.name || 'student').replace(/[^a-zA-Z0-9]/g, '_');
        const fileToShare = new File([blob], `${cleanName}_photo.jpg`, {
          type: blob.type || 'image/jpeg'
        });

        if (navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            title: `Admission Confirmed - ${submittedData.name}`,
            text: textToShare,
            files: [fileToShare]
          });
          fileShared = true;
        }
      } catch (e) {
        console.warn('File share attempt failed:', e);
      }
    }

    if (!fileShared) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Admission Confirmed - ${submittedData.name}`,
            text: textToShare
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
          }
        }
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
      }
    }
  };

  // ============================================================================
  // CONFIRMATION SCREEN (Rendered on success)
  // ============================================================================
  if (submittedData) {
    return (
      <div className="rf-container">
        <div className="rf-confirmation">
          <div className="rf-success-badge">✓</div>
          <h2 className="rf-confirm-title">🎉 Heartiest Congratulations, {submittedData.name}! 🎓</h2>
          <p className="rf-confirm-desc">
            Your admission registration for <strong>{submittedData.course}</strong> has been successfully submitted and verified.
          </p>

          {submittedData.photoUrl && (
            <div className="rf-confirm-photo-box">
              <img
                src={submittedData.photoUrl}
                alt="Student Passport Photo"
                className="rf-confirm-student-avatar"
              />
              <div className="rf-confirm-photo-label">Student Photo</div>
            </div>
          )}

          <div className="rf-ref-box">
            <div className="rf-ref-row">
              <span className="rf-ref-label">Reference ID</span>
              <span className="rf-ref-val">
                <span className="rf-ref-id">{submittedData.referenceId}</span>
              </span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Applicant Name</span>
              <span className="rf-ref-val">{submittedData.name}</span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Father's Name</span>
              <span className="rf-ref-val">{submittedData.fatherName}</span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Mobile Number</span>
              <span className="rf-ref-val">{submittedData.mobileNumber}</span>
            </div>
            {submittedData.alternateMobile && (
              <div className="rf-ref-row">
                <span className="rf-ref-label">Alternate Mobile</span>
                <span className="rf-ref-val">{submittedData.alternateMobile}</span>
              </div>
            )}
            <div className="rf-ref-row">
              <span className="rf-ref-label">Class</span>
              <span className="rf-ref-val">{submittedData.studentClass}</span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Course</span>
              <span className="rf-ref-val">{submittedData.course}</span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Student Photo</span>
              <span className="rf-ref-val">{submittedData.photoName || 'Uploaded'}</span>
            </div>
            <div className="rf-ref-row">
              <span className="rf-ref-label">Aadhaar Document</span>
              <span className="rf-ref-val">{submittedData.fileName}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="rf-btn-submit" onClick={handleShare} style={{ flex: 1, backgroundColor: '#10b981' }}>
              Share via WhatsApp
            </button>
            <button type="button" className="rf-btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // REGISTRATION FORM
  // ============================================================================
  return (
    <div className="rf-container">
      {/* Form Header */}
      <div className="rf-header">
        <h2 className="rf-title">Candidate Details</h2>
        <p className="rf-subtitle">Let's get to know you better. Fields marked with an asterisk (*) are required.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="rf-form">
        {/* API Failure Error Alert */}
        {apiError && (
          <div className="rf-alert-error" role="alert">
            <span>⚠</span>
            <div>{apiError}</div>
          </div>
        )}

        <div className="rf-grid">
          {/* Name Field */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="name">
              <span>Name <span className="rf-req">*</span></span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={`rf-input ${errors.name && touched.name ? 'rf-has-error' : ''}`}
              placeholder="Enter student full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              disabled={loading}
            />
            {errors.name && touched.name && <div className="rf-error-msg">{errors.name}</div>}
          </div>

          {/* Father's Name Field */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="fatherName">
              <span>Father's Name <span className="rf-req">*</span></span>
            </label>
            <input
              id="fatherName"
              name="fatherName"
              type="text"
              className={`rf-input ${errors.fatherName && touched.fatherName ? 'rf-has-error' : ''}`}
              placeholder="Enter father's name"
              value={formData.fatherName}
              onChange={handleChange}
              onBlur={() => handleBlur('fatherName')}
              disabled={loading}
            />
            {errors.fatherName && touched.fatherName && (
              <div className="rf-error-msg">{errors.fatherName}</div>
            )}
          </div>
        </div>

        <div className="rf-grid">
          {/* Mobile Number Field */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="mobileNumber">
              <span>Mobile Number <span className="rf-req">*</span></span>
            </label>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              className={`rf-input ${errors.mobileNumber && touched.mobileNumber ? 'rf-has-error' : ''}`}
              placeholder="10-digit mobile number"
              value={formData.mobileNumber}
              onChange={handleMobileChange}
              onBlur={() => handleBlur('mobileNumber')}
              disabled={loading}
            />
            {errors.mobileNumber && touched.mobileNumber && (
              <div className="rf-error-msg">{errors.mobileNumber}</div>
            )}
          </div>

          {/* Alternate Mobile Field */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="alternateMobile">
              <span>Alternate Mobile <span className="rf-hint">(Optional)</span></span>
            </label>
            <input
              id="alternateMobile"
              name="alternateMobile"
              type="tel"
              className={`rf-input ${errors.alternateMobile && touched.alternateMobile ? 'rf-has-error' : ''}`}
              placeholder="10-digit mobile number"
              value={formData.alternateMobile}
              onChange={handleMobileChange}
              onBlur={() => handleBlur('alternateMobile')}
              disabled={loading}
            />
            {errors.alternateMobile && touched.alternateMobile && (
              <div className="rf-error-msg">{errors.alternateMobile}</div>
            )}
          </div>
        </div>

        <div className="rf-grid">
          {/* Class (Dropdown) */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="studentClass">
              <span>Class <span className="rf-req">*</span></span>
            </label>
            <select
              id="studentClass"
              name="studentClass"
              className={`rf-select ${errors.studentClass && touched.studentClass ? 'rf-has-error' : ''}`}
              value={formData.studentClass}
              onChange={handleChange}
              onBlur={() => handleBlur('studentClass')}
              disabled={loading}
            >
              <option value="">-- Select Class --</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.studentClass && touched.studentClass && (
              <div className="rf-error-msg">{errors.studentClass}</div>
            )}
          </div>

          {/* Course (Dropdown) */}
          <div className="rf-group">
            <label className="rf-label" htmlFor="course">
              <span>Course <span className="rf-req">*</span></span>
            </label>
            <select
              id="course"
              name="course"
              className={`rf-select ${errors.course && touched.course ? 'rf-has-error' : ''}`}
              value={formData.course}
              onChange={handleChange}
              onBlur={() => handleBlur('course')}
              disabled={loading}
            >
              <option value="">-- Select Course --</option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.course && touched.course && (
              <div className="rf-error-msg">{errors.course}</div>
            )}
          </div>
        </div>

        {/* Address (Textarea) */}
        <div className="rf-group">
          <label className="rf-label" htmlFor="address">
            <span>Address <span className="rf-req">*</span></span>
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            className={`rf-textarea ${errors.address && touched.address ? 'rf-has-error' : ''}`}
            placeholder="Enter complete residential address"
            value={formData.address}
            onChange={handleChange}
            onBlur={() => handleBlur('address')}
            disabled={loading}
          />
          {errors.address && touched.address && (
            <div className="rf-error-msg">{errors.address}</div>
          )}
        </div>

        {/* Document & Photo Uploads (2-column responsive grid) */}
        <div className="rf-grid">
          {/* 1. Student Passport Photo */}
          <div className="rf-group">
            <div className="rf-label">
              <span>Student Photo <span className="rf-req">*</span></span>
              <span className="rf-hint">Passport Size (Max 5MB)</span>
            </div>

            <input
              type="file"
              id="student_photo"
              ref={photoInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePhotoChange(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
              disabled={loading}
            />

            {!photo ? (
              <div
                className={`rf-upload-dropzone ${errors.photo && touched.photo ? 'rf-has-error' : ''}`}
                onClick={() => photoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePhotoChange(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📷</div>
                <div className="rf-upload-title">Upload Student Photo</div>
                <div className="rf-upload-desc">Passport format (JPG, PNG, WebP)</div>
              </div>
            ) : (
              <div className="rf-preview-card">
                <div className="rf-img-thumb-container rf-student-thumb">
                  <img src={photoPreview} alt="Student Photo" className="rf-img-thumb" />
                </div>

                <div className="rf-preview-info">
                  <div className="rf-preview-name" title={photo.name}>
                    {photo.name}
                  </div>
                  <div className="rf-preview-size">
                    {(photo.size / (1024 * 1024)).toFixed(2)} MB • PHOTO
                  </div>
                </div>

                <button
                  type="button"
                  className="rf-btn-remove"
                  onClick={handleRemovePhoto}
                  disabled={loading}
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            )}

            {errors.photo && touched.photo && <div className="rf-error-msg">{errors.photo}</div>}
          </div>

          {/* 2. Aadhaar Card Upload */}
          <div className="rf-group">
            <div className="rf-label">
              <span>Aadhar Card Upload <span className="rf-req">*</span></span>
              <span className="rf-hint">PDF or Image (Max 5MB)</span>
            </div>

            <input
              type="file"
              id="aadhar_file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
              disabled={loading}
            />

            {!file ? (
              <div
                className={`rf-upload-dropzone ${errors.file && touched.file ? 'rf-has-error' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📄</div>
                <div className="rf-upload-title">Upload Aadhaar Document</div>
                <div className="rf-upload-desc">Accepted: JPG, PNG, or PDF</div>
              </div>
            ) : (
              <div className="rf-preview-card">
                {filePreview ? (
                  <div className="rf-img-thumb-container">
                    <img src={filePreview} alt="Aadhaar Preview" className="rf-img-thumb" />
                  </div>
                ) : (
                  <div className="rf-file-icon">📄</div>
                )}

                <div className="rf-preview-info">
                  <div className="rf-preview-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="rf-preview-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </div>
                </div>

                <button
                  type="button"
                  className="rf-btn-remove"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            )}

            {errors.file && touched.file && <div className="rf-error-msg">{errors.file}</div>}
          </div>
        </div>

        {/* Submit Button with Spinner & Disabled State while uploading */}
        <button 
          type="submit" 
          className="rf-btn-submit" 
          disabled={loading || !file || !photo}
        >
          {loading ? (
            <>
              <div className="rf-spinner"></div>
              <span>Processing Application...</span>
            </>
          ) : (
            <span>Join the Program 🚀</span>
          )}
        </button>
      </form>
    </div>
  );
}
