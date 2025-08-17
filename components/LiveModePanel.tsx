
import React from 'react';
import { LiveAiResponse, LiveModeSourceType } from '../types';

interface LiveModePanelProps {
  userMediaStream: MediaStream | null;
  aiResponse: LiveAiResponse | null;
  isMicMuted: boolean;
  isCamOrScreenOff: boolean;
  onToggleMic: () => void;
  onToggleCamOrScreen: () => void;
  onEndLiveMode: () => void;
  isLoadingAi: boolean;
  liveModeSource: LiveModeSourceType;
}

const LiveModePanel: React.FC<LiveModePanelProps> = ({
  userMediaStream,
  aiResponse,
  isMicMuted,
  isCamOrScreenOff,
  onToggleMic,
  onToggleCamOrScreen,
  onEndLiveMode,
  isLoadingAi,
  liveModeSource,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && userMediaStream) {
      if (videoRef.current.srcObject !== userMediaStream) {
        videoRef.current.srcObject = userMediaStream;
        videoRef.current.play().catch(console.error);
      }
    }
  }, [userMediaStream]);

  const sourceName = liveModeSource === 'screen' ? 'Screen' : 'Camera';
  const toggleCamIcon = isCamOrScreenOff ? `fa-video-slash` : `fa-video`;
  const toggleMicIcon = isMicMuted ? `fa-microphone-slash` : `fa-microphone`;
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden'
    }} className="animate-fadeIn">

      {/* Video Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: liveModeSource === 'camera' ? 'scaleX(-1)' : 'none',
            display: isCamOrScreenOff ? 'none' : 'block',
          }}
        />
        {isCamOrScreenOff && (
            <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'var(--bg-secondary)'}}>
                <i className={`fas fa-eye-slash fa-5x`} style={{color: 'var(--text-tertiary)'}}></i>
            </div>
        )}
      </div>

      {/* Overlay Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 30%, transparent 60%, rgba(0,0,0,0.5) 100%)',
        padding: '1.5rem 2rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <i className="fas fa-bolt" style={{color: 'var(--primary-color)', marginRight:'0.75rem'}}></i>
            Live {sourceName} Mode
          </h2>
          <button
            onClick={onEndLiveMode}
            style={{
              padding: '0.6rem 1.2rem', backgroundColor: '#ef4444', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
            className="focus-ring"
          >
            <i className="fas fa-sign-out-alt"></i> End Session
          </button>
        </div>

        {/* Footer with AI response and controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            minHeight: '100px',
            backgroundColor: 'rgba(13, 17, 23, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid rgba(48, 54, 61, 0.8)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center'
          }}>
            <p style={{fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>
                {aiResponse?.userTranscript || (isLoadingAi ? "Listening..." : "Waiting for your command...")}
            </p>
            <p style={{
                fontSize: '1.2rem',
                fontWeight: 500,
                transition: 'opacity 0.3s',
                opacity: isLoadingAi ? 0.6 : 1,
            }}>
                {isLoadingAi && !aiResponse?.text ? 'Thinking...' : aiResponse?.text}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={onToggleMic}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                       backgroundColor: isMicMuted ? '#b91c1c' : 'var(--bg-tertiary)', color: 'var(--text-primary)'
              }}
              className="focus-ring"
            >
              <i className={`fas ${toggleMicIcon}`}></i>
            </button>
            <button
              onClick={onToggleCamOrScreen}
              title={isCamOrScreenOff ? `Turn ${sourceName} On` : `Turn ${sourceName} Off`}
              style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                       backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)'
              }}
              className="focus-ring"
            >
              <i className={`fas ${toggleCamIcon}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveModePanel;
