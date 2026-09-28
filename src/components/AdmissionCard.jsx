import React, { forwardRef, useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Phone,
  User,
  MapPin,
  Landmark
} from 'lucide-react';
import './AdmissionCard.css';

/**
 * Exact replica of the reference admission card with 100% reliable vector assets
 * Eliminates all emojis so html2canvas never drops text in downloaded images
 */
const AdmissionCard = forwardRef(function AdmissionCard({ submissionData, photoSrc }, ref) {
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    let isMounted = true;
    fetch('/logo.png')
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setLogoSrc(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.warn('Could not load logo as data URI:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const studentName = submissionData?.name || submissionData?.fullName || 'TANFEEZ AHMAD';
  const course = submissionData?.course || 'English Development Level 1';
  const studentClass = submissionData?.studentClass || submissionData?.class || '1st Class';
  const fatherName = submissionData?.fatherName || submissionData?.father_name || '';
  const mobile = submissionData?.mobileNumber || submissionData?.phone || '';
  const address = submissionData?.address || '';
  
  const formattedDate = new Date(submissionData?.timestamp || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const photo = photoSrc || submissionData?.photoDataUri || submissionData?.photoUrl || submissionData?.remotePhotoUrl;

  return (
    <div className="admission-card-outer" ref={ref} id="admission-card-capture">
      {/* 1. Header Banner */}
      <div className="admission-card-header">
        <div className="admission-card-header-top">
          <div className="admission-card-brand-group">
            <div className="admission-card-logo-container">
              <img
                src={logoSrc || '/logo.png'}
                alt="PrepMagic Official Logo"
                className="admission-card-original-logo"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          <div className="admission-card-header-badge">
            <span>★ OFFICIAL ADMISSION 2026</span>
          </div>
        </div>

        <div className="admission-card-header-row">
          <div className="admission-card-title-col">
            <h2 className="admission-card-prog-h1">
              <span className="admission-card-white-text">Skill Development </span>
              <span className="admission-card-yellow-text">Program 2026</span>
            </h2>
            <p className="admission-card-prog-sub">Official Admission &amp; Registration Record</p>
          </div>

          <div className="admission-card-header-doodle">
            <span className="doodle-rays-header">\ | /</span>
            <span>Your</span>
            <span>Future</span>
            <span>Starts Here</span>
            <svg className="doodle-underline-svg" viewBox="0 0 50 6" fill="none">
              <path d="M1 3.5C12 1 35 1 49 4.5" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Student Hero Section */}
      <div className="admission-card-hero">
        <div className="admission-card-photo-col">
          <span className="photo-doodle-rays">\ | /</span>
          <div className="admission-card-photo-frame">
            {photo ? (
              <img
                src={photo}
                alt={studentName}
                className="admission-card-photo-img"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="admission-card-photo-empty">
                <span style={{ fontSize: '32px', marginBottom: '4px' }}>👤</span>
                <span>Photo</span>
              </div>
            )}
          </div>
          <div className="admission-card-verified-badge">
            <span className="verified-check-svg">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </span>
            <span className="verified-text">Verified Student</span>
          </div>
        </div>

        <div className="admission-card-student-meta">
          {/* Congratulations Pill with Vector Party Popper */}
          <div className="admission-card-congrat-pill">
            <span className="popper-icon-wrap">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                <path d="M3 21L12 18L6 12L3 21Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
                <path d="M5 19L9.5 17.5L6.5 14.5L5 19Z" fill="#fbbf24" />
                <circle cx="15" cy="8" r="1.8" fill="#ec4899" />
                <circle cx="19" cy="12" r="1.5" fill="#3b82f6" />
                <circle cx="12" cy="5" r="1.5" fill="#10b981" />
                <path d="M14 12C16 11 18 13 20 11" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 9C11 7 13 8 14 6" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 16C18 15 19 17 21 16" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="congrat-text">Congratulations!</span>
          </div>

          <h1 className="admission-card-student-name">{studentName}</h1>

          <div className="admission-card-course-row">
            {/* Course Pill with Vector Open Book */}
            <div className="admission-card-course-pill">
              <span className="book-icon-wrap">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#7e22ce" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="#e9d5ff" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="#e9d5ff" />
                </svg>
              </span>
              <span className="course-text">{course}</span>
            </div>

            <div className="admission-card-side-doodle">
              <span className="side-doodle-rays">\ | /</span>
              <span>Keep</span>
              <span>Learning</span>
              <span>Keep Growing</span>
              <svg style={{ width: 44, height: 6, marginTop: 2 }} viewBox="0 0 44 6" fill="none">
                <path d="M2 3.5C11 1.5 32 1.5 42 4" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Academic Details Container */}
      <div className="admission-card-details-box">
        <div className="admission-card-grid">
          {/* Class / Grade */}
          <div className="admission-card-item">
            <div className="admission-card-icon-circle circle-blue">
              <GraduationCap size={18} strokeWidth={2.4} />
            </div>
            <div className="admission-card-item-content">
              <span className="admission-card-item-label">CLASS / GRADE</span>
              <span className="admission-card-item-val">{studentClass}</span>
            </div>
          </div>

          {/* Father's Name */}
          <div className="admission-card-item">
            <div className="admission-card-icon-circle circle-pink">
              <User size={18} strokeWidth={2.4} />
            </div>
            <div className="admission-card-item-content">
              <span className="admission-card-item-label">FATHER'S NAME</span>
              <span className="admission-card-item-val">{fatherName || 'Not Provided'}</span>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="admission-card-item">
            <div className="admission-card-icon-circle circle-green">
              <Phone size={18} strokeWidth={2.4} />
            </div>
            <div className="admission-card-item-content">
              <span className="admission-card-item-label">MOBILE NUMBER</span>
              <span className="admission-card-item-val">{mobile || 'N/A'}</span>
            </div>
          </div>

          {/* Admission Date */}
          <div className="admission-card-item">
            <div className="admission-card-icon-circle circle-orange">
              <Calendar size={18} strokeWidth={2.4} />
            </div>
            <div className="admission-card-item-content">
              <span className="admission-card-item-label">ADMISSION DATE</span>
              <span className="admission-card-item-val">{formattedDate}</span>
            </div>
          </div>

          {/* Address */}
          {address && (
            <div className="admission-card-item full-width">
              <div className="admission-card-icon-circle circle-purple">
                <MapPin size={18} strokeWidth={2.4} />
              </div>
              <div className="admission-card-item-content">
                <span className="admission-card-item-label">ADDRESS / LOCATION</span>
                <span className="admission-card-item-val">{address}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Congratulatory Trophy Box */}
      <div className="admission-card-trophy-box">
        {/* Shiny Golden Trophy SVG with Laurel Leaves */}
        <div className="trophy-svg-wrapper">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <path
              d="M26 62C18 52 18 36 28 26C24 38 26 50 34 58"
              fill="none"
              stroke="#eab308"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M74 62C82 52 82 36 72 26C76 38 74 50 66 58"
              fill="none"
              stroke="#eab308"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="21" cy="40" r="3" fill="#eab308" />
            <circle cx="23" cy="52" r="3" fill="#eab308" />
            <circle cx="79" cy="40" r="3" fill="#eab308" />
            <circle cx="77" cy="52" r="3" fill="#eab308" />
            
            <rect x="36" y="80" width="28" height="6" rx="2" fill="#1e293b" />
            <rect x="40" y="74" width="20" height="6" rx="1" fill="#cbd5e1" />
            
            <path d="M46 64L45 74H55L54 64H46Z" fill="#ca8a04" />
            
            <path
              d="M32 28H68V48C68 58 59 64 50 64C41 64 32 58 32 48V28Z"
              fill="#eab308"
            />
            <path
              d="M36 30H64V46C64 54 57 60 50 60C43 60 36 54 36 46V30Z"
              fill="#facc15"
            />
            
            <path
              d="M32 34C24 34 22 46 32 50"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M68 34C76 34 78 46 68 50"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            
            <polygon
              points="50,38 52,43 57,43 53,46 55,51 50,48 45,51 47,46 43,43 48,43"
              fill="#ffffff"
            />
          </svg>
        </div>

        <div className="trophy-content-col">
          <div className="trophy-content-title">
            <span>Welcome to the PrepMagic Family!</span>
          </div>
          <p className="trophy-content-text">
            Your admission registration has been successfully confirmed and verified. We wish you tremendous growth, skills mastery, and grand success in your learning journey!
          </p>
        </div>

        <div className="trophy-side-doodle">
          <span>Dream</span>
          <span>Learn</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            Achieve
            <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="#15803d">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </span>
        </div>
      </div>

      {/* 5. Footer Bar */}
      <div className="admission-card-footer-bar">
        <svg className="footer-wave-left" viewBox="0 0 60 40" fill="none">
          <path d="M0 40C20 38 35 25 30 0H0V40Z" fill="#dbeafe" />
        </svg>
        <svg className="footer-wave-right" viewBox="0 0 60 40" fill="none">
          <path d="M60 40C40 38 25 25 30 0H60V40Z" fill="#fef08a" />
        </svg>

        <div className="admission-card-council-col">
          <div className="council-icon-circle">
            <Landmark size={18} strokeWidth={2.4} />
          </div>
          <div className="council-text-wrap">
            <span className="council-main-title">PREPMAGIC</span>
            <span className="council-sub-title">ACADEMIC COUNCIL</span>
          </div>
        </div>

        <div className="footer-divider-line"></div>

        <div className="admission-card-status-col">
          <div className="status-check-circle">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="status-text-wrap">
            <span className="status-main-title">OFFICIALLY ADMITTED</span>
            <span className="status-sub-title">Your Education, Our Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdmissionCard;
