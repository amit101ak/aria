import React, { useRef, useEffect } from 'react';

interface LiveViewComponentProps {
    mediaStream: MediaStream | null;
}

const LiveViewComponent: React.FC<LiveViewComponentProps> = ({ mediaStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            // Check if the stream is valid and active
            if (mediaStream && mediaStream.active) {
                // Only update srcObject if it's a different stream
                if (videoRef.current.srcObject !== mediaStream) {
                    videoRef.current.srcObject = mediaStream;
                }
                // Attempt to play the video if it's paused
                if (videoRef.current.paused) {
                    videoRef.current.play().catch(err => console.error("Error playing media stream:", err));
                }
            } else {
                // Clear the source if the stream is null or inactive
                videoRef.current.srcObject = null;
            }
        }
    }, [mediaStream]);

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {mediaStream && mediaStream.active ? (
                <video
                    ref={videoRef}
                    muted
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <div style={{textAlign: 'center'}}>
                    <i className="fas fa-video-slash fa-2x"></i>
                    <p style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>No stream available</p>
                </div>
            )}
        </div>
    );
};

export default LiveViewComponent;