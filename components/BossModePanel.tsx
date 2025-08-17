import React from 'react';

interface BossModePanelProps {
  onExit: () => void;
}

const BossModePanel: React.FC<BossModePanelProps> = ({ onExit }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: 'var(--text-primary)',
      textAlign: 'center'
    }} className="animate-fadeIn">
      <i className="fas fa-chart-line fa-4x" style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}></i>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Quarterly Synergy Report</h2>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '2rem' }}>
        Analyzing key performance indicators and leveraging dynamic growth paradigms to maximize shareholder value.
      </p>
      
      <div style={{
        width: '80%',
        maxWidth: '600px',
        height: '300px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>[Chart Data Loading...]</p>
      </div>

      <button
        onClick={onExit}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 500,
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        className="focus-ring"
      >
        <i className="fas fa-sign-out-alt"></i> Exit Boss Mode
      </button>
    </div>
  );
};

export default BossModePanel;