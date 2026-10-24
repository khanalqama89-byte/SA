import React from 'react';
import { UploadCloud, SlidersHorizontal, Cpu, Download, Check } from 'lucide-react';

export default function ConversionFlowSteps({ currentStep = 1 }) {
  const steps = [
    { num: 1, label: 'Upload File', icon: UploadCloud },
    { num: 2, label: 'Preview & Options', icon: SlidersHorizontal },
    { num: 3, label: 'Convert', icon: Cpu },
    { num: 4, label: 'Download Result', icon: Download }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '2rem',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)',
        padding: '0.45rem 0.85rem',
        boxShadow: 'var(--shadow-sm)',
        maxWidth: '100%',
        overflowX: 'auto',
        gap: '0.35rem'
      }}>
        {steps.map((s, idx) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.num}>
              {idx > 0 && (
                <div style={{
                  width: '24px',
                  height: '2px',
                  background: isDone ? 'var(--primary)' : 'var(--border)',
                  flexShrink: 0
                }} />
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: isCurrent
                  ? 'var(--primary)'
                  : isDone
                  ? 'var(--primary-light)'
                  : 'transparent',
                color: isCurrent
                  ? '#ffffff'
                  : isDone
                  ? 'var(--primary)'
                  : 'var(--text-subtle)',
                fontWeight: isCurrent ? 800 : 600,
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isCurrent ? 'rgba(255, 255, 255, 0.25)' : isDone ? 'var(--primary)' : 'rgba(0, 0, 0, 0.06)',
                  color: isCurrent ? '#ffffff' : isDone ? '#ffffff' : 'var(--text-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {isDone ? <Check size={11} strokeWidth={3} /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
