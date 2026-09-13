import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, RotateCcw, FileCheck, ShieldCheck } from 'lucide-react';

export default function SuccessCard({ submissionData, onReset }) {
  const [copied, setCopied] = useState(false);

  const refId = submissionData?.referenceId || submissionData?.submissionId || 'N/A';

  const handleCopy = () => {
    if (refId) {
      navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!submissionData) return;
    
    const textToShare = `*Registration Successful!*\n\n*Name:* ${submissionData.name || submissionData.fullName}\n*Ref ID:* ${refId}\n*Class:* ${submissionData.studentClass}\n*Course:* ${submissionData.course}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Student Registration Details',
          text: textToShare,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
    }
  };

  return (
    <div className="success-wrapper">
      <div className="success-icon-badge">
        <CheckCircle2 size={44} />
      </div>

      <h2 className="success-title">Registration Submitted Successfully!</h2>
      <p className="success-desc">
        Your registration details and Aadhaar document have been safely encrypted and received.
      </p>

      {/* Confirmation Details Card */}
      <div className="receipt-card">
        {/* Reference ID */}
        <div className="receipt-row highlight-row">
          <span className="receipt-label">Reference Tracking ID</span>
          <span className="receipt-val mono" style={{ color: '#818cf8', fontWeight: 700 }}>
            {refId}
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopy}
              title="Copy Reference ID to clipboard"
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </span>
        </div>

        {/* Student Name */}
        <div className="receipt-row">
          <span className="receipt-label">Student Name</span>
          <span className="receipt-val">{submissionData?.name || submissionData?.fullName}</span>
        </div>

        {/* Mobile Number */}
        <div className="receipt-row">
          <span className="receipt-label">Mobile Number</span>
          <span className="receipt-val mono">{submissionData?.mobileNumber || submissionData?.phone}</span>
        </div>

        {/* Class */}
        {submissionData?.studentClass && (
          <div className="receipt-row">
            <span className="receipt-label">Class / Grade</span>
            <span className="receipt-val">{submissionData.studentClass}</span>
          </div>
        )}

        {/* Father's Name */}
        {submissionData?.fatherName && (
          <div className="receipt-row">
            <span className="receipt-label">Father's Name</span>
            <span className="receipt-val">{submissionData.fatherName}</span>
          </div>
        )}

        {/* Alternate Mobile */}
        {submissionData?.alternateMobile && (
          <div className="receipt-row">
            <span className="receipt-label">Alternate Mobile</span>
            <span className="receipt-val mono">{submissionData.alternateMobile}</span>
          </div>
        )}

        {/* Course */}
        {submissionData?.course && (
          <div className="receipt-row">
            <span className="receipt-label">Course</span>
            <span className="receipt-val">{submissionData.course}</span>
          </div>
        )}

        {/* Address */}
        {submissionData?.address && (
          <div className="receipt-row">
            <span className="receipt-label">Address</span>
            <span className="receipt-val" style={{ maxWidth: 280, textAlign: 'right', fontSize: '0.85rem' }}>
              {submissionData.address}
            </span>
          </div>
        )}

        {/* Document */}
        {submissionData?.fileName && (
          <div className="receipt-row">
            <span className="receipt-label">Aadhaar File</span>
            <span className="receipt-val" style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
              <FileCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              {submissionData.fileName}
            </span>
          </div>
        )}

      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="button" onClick={handleShare} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Share via WhatsApp
        </button>
        <button type="button" className="btn-secondary" onClick={onReset} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: '8px', border: '1px solid #4f46e5', background: 'transparent', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>
          <RotateCcw size={16} />
          <span>Register Another</span>
        </button>
      </div>
    </div>
  );
}
