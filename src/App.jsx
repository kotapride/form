import React, { useState } from 'react';
import { ShieldCheck, Lock, ExternalLink, GraduationCap } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import SuccessCard from './components/SuccessCard';

export default function App() {
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleReset = () => {
    setSubmissionResult(null);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="portal-header">
        <div className="brand-badge">
          <span className="pulse-dot"></span>
          <span>Welcome to Prep Magic</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/logo.png" alt="PrepMagic Logo" style={{ maxWidth: '300px', height: 'auto' }} />
        </div>
        <h1 className="portal-title">
          Skill Development Program 2026
        </h1>
        <p className="portal-subtitle">
          We are thrilled to welcome you! Please provide your details below to kickstart your journey with us. Make sure to upload a clear copy of your Aadhaar card for quick verification.
        </p>
      </header>

      {/* Main Form Glass Card */}
      <main className="form-card">
        {!submissionResult ? (
          <RegistrationForm onSuccess={(data) => setSubmissionResult(data)} />
        ) : (
          <SuccessCard submissionData={submissionResult} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={14} color="#10b981" />
          <span>Stateless Vercel Serverless Function • Direct Supabase Storage Stream</span>
        </div>
        <div style={{ marginTop: 4 }}>
          <span>Administrator? </span>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>Open Admin Panel</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
