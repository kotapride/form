import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  FileCheck,
  Sparkles,
  Share2,
  Send,
  Loader2,
  GraduationCap
} from 'lucide-react';

export function buildCongratulatoryMessage(data) {
  const studentName = data?.name || data?.fullName || 'Student';
  const refId = data?.referenceId || data?.submissionId || 'N/A';
  const course = data?.course || 'Skill Development';
  const studentClass = data?.studentClass || data?.class || 'N/A';
  const fatherName = data?.fatherName || data?.father_name || '';
  const mobile = data?.mobileNumber || data?.phone || '';
  const alternateMobile = data?.alternateMobile || '';
  const address = data?.address || '';
  const photoUrl = data?.remotePhotoUrl || data?.photoUrl || '';
  const formattedDate = new Date(data?.timestamp || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `🎓🎉 *HEARTIEST CONGRATULATIONS, ${studentName.toUpperCase()}!* 🎉🎓
━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *PrepMagic Skill Development Program 2026* ✨

Dear *${studentName}*,
We are delighted to confirm that your admission registration has been *successfully verified and recorded*! Welcome to PrepMagic! 🚀

📋 *CONFIRMED REGISTRATION DETAILS:*
• 👤 *Student Name:* ${studentName}
• 🆔 *Reference ID:* ${refId}
• 📚 *Class / Grade:* ${studentClass}
• 🎯 *Course Enrolled:* ${course}
• 👨‍👦 *Father's Name:* ${fatherName}
• 📱 *Mobile Number:* ${mobile}
${alternateMobile ? `• 📞 *Alternate Mobile:* ${alternateMobile}\n` : ''}${address ? `• 📍 *Address:* ${address}\n` : ''}• 🗓️ *Registration Date:* ${formattedDate}
${photoUrl ? `\n📸 *Student Passport Photo:* \n${photoUrl}\n` : ''}
🌟 *We wish you tremendous success in your learning journey!* 🌟
— *Team PrepMagic*
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

export default function SuccessCard({ submissionData, onReset }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const refId = submissionData?.referenceId || submissionData?.submissionId || 'N/A';
  const studentName = submissionData?.name || submissionData?.fullName || 'Student';
  const course = submissionData?.course || 'Skill Development';
  const photoUrl = submissionData?.remotePhotoUrl || submissionData?.photoUrl;

  const handleCopy = () => {
    if (refId) {
      navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const textToShare = buildCongratulatoryMessage(submissionData);
    window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
  };

  const handleShareWithPhoto = async () => {
    if (!submissionData) return;
    const textToShare = buildCongratulatoryMessage(submissionData);
    setSharing(true);

    try {
      let fileShared = false;
      // Try sharing with file if photo is available and browser supports file sharing
      if (photoUrl && navigator.share && navigator.canShare) {
        try {
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
          const fileToShare = new File([blob], `${cleanName}_photo.jpg`, {
            type: blob.type || 'image/jpeg'
          });

          if (navigator.canShare({ files: [fileToShare] })) {
            await navigator.share({
              title: `Admission Confirmed - ${studentName}`,
              text: textToShare,
              files: [fileToShare]
            });
            fileShared = true;
          }
        } catch (fileErr) {
          console.warn('File share attempt failed, falling back:', fileErr);
        }
      }

      if (!fileShared) {
        if (navigator.share) {
          await navigator.share({
            title: `Admission Confirmed - ${studentName}`,
            text: textToShare
          });
        } else {
          handleWhatsAppShare();
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleWhatsAppShare();
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="success-wrapper">
      {/* Celebration Header Badge */}
      <div className="success-celebration-badge">
        <Sparkles size={16} />
        <span>Admission Registration Confirmed</span>
      </div>

      <div className="success-icon-badge">
        <GraduationCap size={44} />
      </div>

      <h2 className="success-title">🎉 Heartiest Congratulations, {studentName}! 🎓</h2>
      <p className="success-desc">
        Your admission registration for <strong>{course}</strong> has been officially confirmed and your documents securely verified.
      </p>

      {/* Student Passport Photo Display */}
      {photoUrl && (
        <div className="success-photo-container">
          <div className="success-photo-frame">
            <img
              src={photoUrl}
              alt={studentName}
              className="success-student-photo"
            />
          </div>
          <div className="success-photo-badge">
            <CheckCircle2 size={13} />
            <span>Verified Student Applicant</span>
          </div>
        </div>
      )}

      {/* Confirmation Details Card */}
      <div className="receipt-card">
        {/* Reference ID */}
        <div className="receipt-row highlight-row">
          <span className="receipt-label">Reference Tracking ID</span>
          <span className="receipt-val mono" style={{ color: '#4f46e5', fontWeight: 700 }}>
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
          <span className="receipt-val">{studentName}</span>
        </div>

        {/* Mobile Number */}
        <div className="receipt-row">
          <span className="receipt-label">Mobile Number</span>
          <span className="receipt-val mono">{submissionData?.mobileNumber || submissionData?.phone}</span>
        </div>

        {/* Class */}
        {(submissionData?.studentClass || submissionData?.class) && (
          <div className="receipt-row">
            <span className="receipt-label">Class / Grade</span>
            <span className="receipt-val">{submissionData.studentClass || submissionData.class}</span>
          </div>
        )}

        {/* Father's Name */}
        {(submissionData?.fatherName || submissionData?.father_name) && (
          <div className="receipt-row">
            <span className="receipt-label">Father's Name</span>
            <span className="receipt-val">{submissionData.fatherName || submissionData.father_name}</span>
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
        {course && (
          <div className="receipt-row">
            <span className="receipt-label">Enrolled Course</span>
            <span className="receipt-val" style={{ color: '#4338ca', fontWeight: 700 }}>{course}</span>
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
            <span className="receipt-label">Aadhaar Document</span>
            <span className="receipt-val" style={{ fontSize: '0.85rem', color: '#4f46e5' }}>
              <FileCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              {submissionData.fileName}
            </span>
          </div>
        )}
      </div>

      {/* Share Actions Grid */}
      <div className="success-actions-grid">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="btn-whatsapp-share"
          title="Share celebratory message & student photo link on WhatsApp"
        >
          <Send size={18} />
          <span>Share on WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleShareWithPhoto}
          className="btn-native-share"
          disabled={sharing}
          title="Share full congratulatory details and student photo file"
        >
          {sharing ? <Loader2 size={18} className="spin" /> : <Share2 size={18} />}
          <span>{sharing ? 'Sharing Photo...' : 'Share Details & Photo'}</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
          style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <RotateCcw size={16} />
          <span>Register Another Student</span>
        </button>
      </div>
    </div>
  );
}

