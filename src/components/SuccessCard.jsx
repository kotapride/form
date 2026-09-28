import React, { useState, useRef, useEffect } from 'react';
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
  GraduationCap,
  Download,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import html2canvas from 'html2canvas';
import AdmissionCard from './AdmissionCard';

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
  const cardRef = useRef(null);
  const [copiedId, setCopiedId] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copyingCard, setCopyingCard] = useState(false);
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [statusToast, setStatusToast] = useState(null);

  const [photoDataUrl, setPhotoDataUrl] = useState(
    submissionData?.photoDataUri || null
  );

  const refId = submissionData?.referenceId || submissionData?.submissionId || 'N/A';
  const studentName = submissionData?.name || submissionData?.fullName || 'Student';
  const course = submissionData?.course || 'Skill Development';

  // Ensure remote or blob photo URL is loaded into a Data URI so html2canvas never suffers CORS issues
  useEffect(() => {
    let active = true;
    const initialSrc =
      submissionData?.photoDataUri ||
      submissionData?.remotePhotoUrl ||
      submissionData?.photoUrl;

    if (!initialSrc) return;

    if (initialSrc.startsWith('data:')) {
      setPhotoDataUrl(initialSrc);
      return;
    }

    fetch(initialSrc, { mode: 'cors' })
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (active) setPhotoDataUrl(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.warn('Could not convert remote photo to data URI, fallback to src:', err);
        if (active) setPhotoDataUrl(initialSrc);
      });

    return () => {
      active = false;
    };
  }, [submissionData]);

  // Copy reference ID
  const handleCopyId = () => {
    if (refId) {
      navigator.clipboard.writeText(refId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Helper to generate crisp card PNG blob
  const generateCardBlob = async () => {
    if (!cardRef.current) return null;

    // Ensure all web fonts are fully loaded before capturing
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Ensure images in card are completely loaded
    const images = cardRef.current.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 600);
          })
      )
    );

    const canvas = await html2canvas(cardRef.current, {
      scale: 2, // 2x resolution for crisp high-dpi image
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const clonedCard = clonedDoc.getElementById('admission-card-capture');
        if (clonedCard) {
          clonedCard.classList.add('export-mode');
          clonedCard.style.width = '600px';
          clonedCard.style.maxWidth = '600px';
          clonedCard.style.minWidth = '600px';
        }
      }
    });

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.95);
    });
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // 1. Primary: Share Card Image on WhatsApp
  const handleShareCard = async () => {
    if (!submissionData) return;
    setSharing(true);
    setStatusToast(null);

    try {
      const blob = await generateCardBlob();
      if (!blob) throw new Error('Could not generate card image');

      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      const filename = `${safeName}_Admission_Card.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      const textToShare = buildCongratulatoryMessage(submissionData);

      // On mobile devices (Android/iOS) and supported desktop browsers:
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Admission Confirmed - ${studentName}`,
          text: textToShare,
          files: [file]
        });
        setStatusToast({ type: 'success', message: 'Card shared successfully!' });
      } else {
        // On desktop browsers where file sharing is unsupported:
        // Automatically save the card image and open WhatsApp with the message text!
        triggerDownload(blob, filename);

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        } catch (_) {}

        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
        setStatusToast({
          type: 'info',
          message: 'Card image downloaded! You can attach it in your WhatsApp chat.'
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share error fallback:', err);
        handleWhatsAppTextOnly();
      }
    } finally {
      setSharing(false);
    }
  };

  // 2. Direct Download Card Image
  const handleDownloadCard = async () => {
    if (!submissionData) return;
    setDownloading(true);
    setStatusToast(null);

    try {
      const blob = await generateCardBlob();
      if (!blob) throw new Error('Could not generate card image');

      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      const filename = `${safeName}_Admission_Card.png`;
      triggerDownload(blob, filename);
      setStatusToast({ type: 'success', message: 'Admission card image downloaded successfully!' });
    } catch (err) {
      console.error('Download card error:', err);
      alert('Failed to download card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // 3. Copy Card Image to System Clipboard
  const handleCopyCard = async () => {
    if (!submissionData) return;
    setCopyingCard(true);
    setStatusToast(null);

    try {
      const blob = await generateCardBlob();
      if (!blob) throw new Error('Could not generate card image');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setStatusToast({
          type: 'success',
          message: 'Card image copied! Press Ctrl+V in WhatsApp or any chat to paste.'
        });
      } else {
        // Fallback to downloading if clipboard image write is not permitted
        handleDownloadCard();
      }
    } catch (err) {
      console.warn('Clipboard write error fallback to download:', err);
      handleDownloadCard();
    } finally {
      setCopyingCard(false);
    }
  };

  // 4. WhatsApp text only share
  const handleWhatsAppTextOnly = () => {
    const textToShare = buildCongratulatoryMessage(submissionData);
    window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`, '_blank');
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
        Your admission registration for <strong>{course}</strong> has been officially confirmed.
        Here is your verified <strong>Admission Card</strong> with your student photo and details:
      </p>

      {/* ==================================================================== */}
      {/* SHAREABLE ADMISSION CARD (LIVE DISPLAY & IMAGE CAPTURE TARGET)       */}
      {/* ==================================================================== */}
      <AdmissionCard
        ref={cardRef}
        submissionData={submissionData}
        photoSrc={photoDataUrl}
      />

      {/* Dynamic Status Toast Notification */}
      {statusToast && (
        <div className={`success-toast ${statusToast.type}`}>
          <CheckCircle2 size={16} />
          <span>{statusToast.message}</span>
        </div>
      )}

      {/* Share & Download Action Buttons Grid */}
      <div className="success-actions-grid">
        {/* Primary Action: Share Card on WhatsApp */}
        <button
          type="button"
          onClick={handleShareCard}
          className="btn-primary-share"
          disabled={sharing}
          title="Share admission card image with student photo and message on WhatsApp"
        >
          {sharing ? (
            <>
              <Loader2 size={20} className="spin" />
              <span>Generating Card Image...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Share Card on WhatsApp</span>
            </>
          )}
        </button>

        {/* Action 2: Download Card Image */}
        <button
          type="button"
          onClick={handleDownloadCard}
          className="btn-download-card"
          disabled={downloading}
          title="Download the admission card as a high-resolution PNG image"
        >
          {downloading ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Saving Image...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download Card (Image)</span>
            </>
          )}
        </button>

        {/* Action 3: Copy Card Image */}
        <button
          type="button"
          onClick={handleCopyCard}
          className="btn-copy-card"
          disabled={copyingCard}
          title="Copy the card image to clipboard to paste directly into WhatsApp"
        >
          {copyingCard ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Copying Image...</span>
            </>
          ) : (
            <>
              <ImageIcon size={18} color="#4f46e5" />
              <span>Copy Card Image</span>
            </>
          )}
        </button>

        {/* Action 4: Text-Only WhatsApp Share */}
        <button
          type="button"
          onClick={handleWhatsAppTextOnly}
          className="btn-text-share"
          title="Share congratulatory details as text message"
        >
          <MessageCircle size={17} />
          <span>Share Message Only</span>
        </button>

        {/* Action 5: Register Another Student */}
        <button
          type="button"
          className="btn-secondary"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          <span>Register Another Student</span>
        </button>
      </div>

      {/* Collapsible Full Receipt Details */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          type="button"
          className="receipt-toggle-btn"
          onClick={() => setShowFullReceipt(!showFullReceipt)}
        >
          <span>{showFullReceipt ? 'Hide' : 'View'} Full Registration Record Details</span>
          {showFullReceipt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFullReceipt && (
        <div className="receipt-card" style={{ marginTop: 12 }}>
          {/* Reference ID */}
          <div className="receipt-row highlight-row">
            <span className="receipt-label">Reference Tracking ID</span>
            <span className="receipt-val mono" style={{ color: '#4f46e5', fontWeight: 700 }}>
              {refId}
              <button
                type="button"
                className="copy-btn"
                onClick={handleCopyId}
                title="Copy Reference ID"
              >
                {copiedId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copiedId ? 'Copied!' : 'Copy'}
              </button>
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Student Name</span>
            <span className="receipt-val">{studentName}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Mobile Number</span>
            <span className="receipt-val mono">{submissionData?.mobileNumber || submissionData?.phone}</span>
          </div>

          {(submissionData?.studentClass || submissionData?.class) && (
            <div className="receipt-row">
              <span className="receipt-label">Class / Grade</span>
              <span className="receipt-val">{submissionData.studentClass || submissionData.class}</span>
            </div>
          )}

          {(submissionData?.fatherName || submissionData?.father_name) && (
            <div className="receipt-row">
              <span className="receipt-label">Father's Name</span>
              <span className="receipt-val">{submissionData.fatherName || submissionData.father_name}</span>
            </div>
          )}

          {submissionData?.alternateMobile && (
            <div className="receipt-row">
              <span className="receipt-label">Alternate Mobile</span>
              <span className="receipt-val mono">{submissionData.alternateMobile}</span>
            </div>
          )}

          {course && (
            <div className="receipt-row">
              <span className="receipt-label">Enrolled Course</span>
              <span className="receipt-val" style={{ color: '#4338ca', fontWeight: 700 }}>{course}</span>
            </div>
          )}

          {submissionData?.address && (
            <div className="receipt-row">
              <span className="receipt-label">Address</span>
              <span className="receipt-val" style={{ maxWidth: 280, textAlign: 'right', fontSize: '0.85rem' }}>
                {submissionData.address}
              </span>
            </div>
          )}

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
      )}
    </div>
  );
}
