





import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UIWindow, UICommand, UIComponent, UIRect, ChatMessage, MessageSender, SecureNote, ManagedFile, GamificationState, Quest, Achievement, WindowType, LearnedData } from '../types';
import LiveViewComponent from './LiveViewComponent';

interface DynamicWindowProps {
    window: UIWindow;
    messages: ChatMessage[];
    secureNote?: SecureNote;
    learnedData: LearnedData;
    gamificationState: GamificationState;
    quests: Quest[];
    achievements: Achievement[];
    onComponentAction: (component: UIComponent, windowId: string) => void;
    onWindowAction: (command: UICommand) => void;
    onBringToFront: (windowId: string) => void;
    onUpdateWindowRect: (windowId: string, newRect: UIRect) => void;
    userMediaStream: MediaStream | null;
    onComponentValueChange: (componentId: string, newValue: string) => void;
    onWindowInternalStateChange: (windowId: string, newState: Partial<UIWindow['internalState']>) => void;
    onProcessUserMessage: (message: string) => void;
    onSaveSecurePhoto: (windowId: string, noteName: string, imageData: string, password: string) => void;
}

const getIconForSource = (sender: MessageSender, source?: string) => {
    if (sender === MessageSender.USER) return { icon: "fas fa-user", color: "var(--primary-color)" };
    if (sender === MessageSender.AI) return { icon: "fas fa-brain", color: "var(--primary-color)" };
    
    switch (source) {
        case 'error': return { icon: "fas fa-exclamation-triangle", color: "#ef4444" };
        case 'system-greeting': return { icon: "fas fa-power-off", color: "var(--primary-color)" };
        case 'system-info': return { icon: "fas fa-cogs", color: "var(--text-secondary)" };
        case 'memory-action':
        case 'personalization':
        case 'visual-memory-action':
             return { icon: "fas fa-brain", color: "var(--primary-color)" };
        default: return { icon: "fas fa-info-circle", color: "var(--text-secondary)" };
    }
};

const getIconForWindowType = (type?: WindowType): string => {
    switch(type) {
        case 'calculator': return 'fas fa-calculator';
        case 'encrypted-note': return 'fas fa-lock';
        case 'secure-photo-creator': return 'fas fa-shield-alt';
        case 'browser': return 'fas fa-globe';
        case 'code-editor': return 'fas fa-code';
        case 'timer': return 'fas fa-hourglass-half';
        case 'focus-mode': return 'fas fa-brain';
        case 'sound-mixer': return 'fas fa-sliders-h';
        case 'tic-tac-toe': return 'fas fa-gamepad';
        case 'activity-log': return 'fas fa-history';
        case 'image-generator': return 'fas fa-paint-brush';
        case 'translator': return 'fas fa-language';
        case 'whiteboard': return 'fas fa-chalkboard';
        case 'file-cabinet': return 'fas fa-folder-open';
        case 'workflow-automator': return 'fas fa-project-diagram';
        case 'game-hub': return 'fas fa-trophy';
        case 'dashboard': return 'fas fa-th-large';
        case 'app-launcher': return 'fas fa-rocket';
        default: return 'fas fa-window-maximize';
    }
}


const xorCipher = (text: string, key: string): string => {
  if (!key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};


const soundSources: { [key: string]: { name: string, src: string, icon: string } } = {
    rain: { name: 'Rain', src: 'https://cdn.pixabay.com/download/audio/2022/10/20/audio_206a31b658.mp3', icon: 'fas fa-cloud-showers-heavy' },
    cafe: { name: 'Café', src: 'https://cdn.pixabay.com/download/audio/2022/04/18/audio_34a275472c.mp3', icon: 'fas fa-coffee' },
    forest: { name: 'Forest', src: 'https://cdn.pixabay.com/download/audio/2022/08/17/audio_34199a9a3b.mp3', icon: 'fas fa-tree' },
};

const focusScenes: { [key: string]: { name: string, backgroundUrl: string, soundKey: string } } = {
    'default': { name: 'Default', backgroundUrl: '', soundKey: '' },
    'rainy-night': { name: 'Rainy Night', backgroundUrl: 'https://images.unsplash.com/photo-1485093722652-2373ab93946a?q=80&w=2600&auto=format&fit=crop', soundKey: 'rain' },
    'cozy-cafe': { name: 'Cozy Café', backgroundUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2647&auto=format&fit=crop', soundKey: 'cafe' },
    'serene-forest': { name: 'Serene Forest', backgroundUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2670&auto=format&fit=crop', soundKey: 'forest' },
};

const languages = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
  'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


const DynamicWindow: React.FC<DynamicWindowProps> = ({ window, messages, secureNote, learnedData, gamificationState, quests, achievements, onComponentAction, onWindowAction, onBringToFront, onUpdateWindowRect, userMediaStream, onComponentValueChange, onWindowInternalStateChange, onProcessUserMessage, onSaveSecurePhoto }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const dragStartPos = useRef({ x: 0, y: 0 });
    const windowStartPos = useRef({ x: 0, y: 0 });
    const parentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, rectX: 0, rectY: 0 });
    const resizeDirection = useRef('');
    
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
    const focusAudioRef = useRef<HTMLAudioElement | null>(null);

    
    const [browserUrlInput, setBrowserUrlInput] = useState(window.internalState?.browserUrl || 'https://www.google.com/search?igu=1&q=welcome+to+aria+os');
    const [appLauncherSearch, setAppLauncherSearch] = useState('');

    useEffect(() => {
        if (window.windowType === 'browser' && window.internalState?.browserUrl && window.internalState.browserUrl !== browserUrlInput) {
            setBrowserUrlInput(window.internalState.browserUrl);
        }
    }, [window.internalState?.browserUrl, window.windowType, browserUrlInput]);


    useEffect(() => {
        if (window.windowType === 'sound-mixer') {
            Object.keys(soundSources).forEach(key => {
                if (!audioRefs.current[key]) {
                    audioRefs.current[key] = new Audio(soundSources[key].src);
                    audioRefs.current[key].loop = true;
                }
            });

            const soundState = window.internalState?.sounds;
            if (soundState) {
                Object.keys(soundState).forEach(key => {
                    const audio = audioRefs.current[key];
                    if (audio) {
                        audio.volume = soundState[key].volume;
                        if (soundState[key].playing && audio.paused) {
                            audio.play().catch(e => console.error(`Error playing ${key}:`, e));
                        } else if (!soundState[key].playing && !audio.paused) {
                            audio.pause();
                        }
                    }
                });
            }
        }
        
        if (window.windowType === 'focus-mode' && window.internalState?.sceneId) {
            const scene = focusScenes[window.internalState.sceneId];
            if (scene && scene.soundKey) {
                const soundSrc = soundSources[scene.soundKey]?.src;
                if (soundSrc) {
                    if (!focusAudioRef.current || focusAudioRef.current.src !== soundSrc) {
                        if (focusAudioRef.current) focusAudioRef.current.pause();
                        focusAudioRef.current = new Audio(soundSrc);
                        focusAudioRef.current.loop = true;
                    }
                    if (focusAudioRef.current.paused) {
                        focusAudioRef.current.play().catch(e => console.error("Error playing focus sound:", e));
                    }
                }
            }
        }


        return () => {
            if (window.windowType === 'sound-mixer') {
                Object.values(audioRefs.current).forEach(audio => audio.pause());
            }
            if (window.windowType === 'focus-mode' && focusAudioRef.current) {
                focusAudioRef.current.pause();
                focusAudioRef.current = null;
            }
        };
    }, [window.windowType, window.internalState]);


    const handleMouseDownOnHeader = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.window-control-button')) return;
        
        onBringToFront(window.id);
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        windowStartPos.current = { x: window.rect.x, y: window.rect.y };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const parent = parentRef.current?.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartPos.current.x) / parentRect.width) * 100;
        const deltaY = ((e.clientY - dragStartPos.current.y) / parentRect.height) * 100;

        let newX = windowStartPos.current.x + deltaX;
        let newY = windowStartPos.current.y + deltaY;
        
        newX = Math.max(0, Math.min(newX, 100 - window.rect.w));
        newY = Math.max(0, Math.min(newY, 100 - window.rect.h));

        onUpdateWindowRect(window.id, { ...window.rect, x: newX, y: newY });
    }, [window.id, window.rect.w, window.rect.h, onUpdateWindowRect]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);
    
    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
        e.stopPropagation();
        e.preventDefault();
        onBringToFront(window.id);
        setIsResizing(true);
        resizeDirection.current = direction;

        const parent = parentRef.current?.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        
        resizeStart.current = {
            x: e.clientX, y: e.clientY,
            w: (window.rect.w / 100) * parentRect.width,
            h: (window.rect.h / 100) * parentRect.height,
            rectX: (window.rect.x / 100) * parentRect.width,
            rectY: (window.rect.y / 100) * parentRect.height
        };
        
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp, { once: true });
    };

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        const parent = parentRef.current?.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        let { x, y, w, h } = { 
            x: resizeStart.current.rectX, 
            y: resizeStart.current.rectY,
            w: resizeStart.current.w,
            h: resizeStart.current.h
        };
        
        const minWidth = 200;
        const minHeight = 150;

        if (resizeDirection.current.includes('right')) w = Math.max(minWidth, resizeStart.current.w + deltaX);
        if (resizeDirection.current.includes('bottom')) h = Math.max(minHeight, resizeStart.current.h + deltaY);
        if (resizeDirection.current.includes('left')) {
            const newW = resizeStart.current.w - deltaX;
            if (newW > minWidth) {
                w = newW;
                x = resizeStart.current.rectX + deltaX;
            }
        }
        if (resizeDirection.current.includes('top')) {
            const newH = resizeStart.current.h - deltaY;
            if (newH > minHeight) {
                h = newH;
                y = resizeStart.current.rectY + deltaY;
            }
        }
        
        onUpdateWindowRect(window.id, {
            x: (x / parentRect.width) * 100,
            y: (y / parentRect.height) * 100,
            w: (w / parentRect.width) * 100,
            h: (h / parentRect.height) * 100,
        });
    }, [window.id, onUpdateWindowRect]);

    const handleResizeMouseUp = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleResizeMouseMove);
    }, [handleResizeMouseMove]);


    const handleClose = () => {
        if (window.windowType === 'sound-mixer') {
             Object.values(audioRefs.current).forEach(audio => {
                if (audio) audio.pause();
            });
        }
         if (window.windowType === 'focus-mode' && focusAudioRef.current) {
            focusAudioRef.current.pause();
            focusAudioRef.current = null;
        }

        if (window.windowType === 'encrypted-note') {
            onWindowAction({
                action: 'UPDATE',
                elementType: 'window',
                targetId: window.id,
                spec: { isHidden: true }
            });
        } else {
            onWindowAction({
                action: 'DELETE',
                elementType: 'window',
                targetId: window.id
            });
        }
    };
    
    const renderComponent = (component: UIComponent) => {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${component.rect.x}%`,
            top: `${component.rect.y}%`,
            width: `${component.rect.w}%`,
            height: `${component.rect.h}%`,
            fontSize: '0.875rem',
            boxSizing: 'border-box',
            ...component.style,
        };

        if (component.type === 'live-view') {
            return (
                <div style={style}>
                     <LiveViewComponent mediaStream={userMediaStream} />
                </div>
            );
        }

        switch (component.type) {
            case 'label':
                return <div style={style}>{component.text}</div>;
            case 'button':
                return (
                    <button 
                        style={{...style, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-tertiary)', color:'var(--text-primary)'}}
                        onClick={() => onComponentAction(component, window.id)}
                        className="hover:bg-border-color focus-ring"
                    >
                        {component.text}
                    </button>
                );
            default:
                return null;
        }
    };
    
    if (window.windowType === 'focus-mode') {
        const timeRemaining = window.internalState?.timeRemaining ?? window.timer_duration_seconds ?? 0;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timerDisplayText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const scene = focusScenes[window.internalState?.sceneId || 'default'] || focusScenes['default'];
        
        return (
            <div
                className="animate-fadeIn"
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'var(--bg-primary)',
                    backgroundImage: `url(${scene.backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 100,
                    pointerEvents: 'all',
                }}
            >
             <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}></div>
                <div
                    className="animate-subtlePopIn"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                        padding: '2rem'
                    }}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, opacity: 0.8, marginBottom: '1rem' }}>Focus Session</h2>
                    <div style={{ fontSize: 'clamp(5rem, 20vw, 10rem)', fontWeight: 'bold', lineHeight: 1 }}>
                        {timerDisplayText}
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.8)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(5px)'
                        }}
                        className="focus-ring"
                        aria-label="End Focus Session"
                    >
                        <i className="fas fa-times-circle"></i> End Session
                    </button>
                </div>
            </div>
        );
    }
    
    const renderWindowContent = () => {
        switch (window.windowType) {
            case 'dashboard': {
                const userName = learnedData.user_name || 'User';
                const { level, xp, xpToNextLevel } = gamificationState;
                const xpProgress = (xp / xpToNextLevel) * 100;
                const activeQuests = quests.filter(q => !q.completed);
                const recentMessages = messages.filter(m => m.sender !== MessageSender.SYSTEM).slice(-3);

                const Widget: React.FC<{title: string, icon: string, children: React.ReactNode, gridColumn?: string, gridRow?: string}> = 
                ({title, icon, children, gridColumn, gridRow}) => (
                    <div style={{
                        gridColumn, gridRow,
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border-color)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        <h3 style={{fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem'}}>
                            <i className={icon} style={{color: 'var(--primary-color)'}}></i>
                            {title}
                        </h3>
                        <div className="custom-scrollbar" style={{flex: 1, overflow: 'auto'}}>
                            {children}
                        </div>
                    </div>
                );
                
                return (
                    <div className="custom-scrollbar" style={{height: '100%', overflowY: 'auto', padding: '1.5rem', background: 'var(--window-bg)'}}>
                        <h2 style={{fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem'}}>Welcome back, {userName}.</h2>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(150px, auto)', gap: '1rem'}}>
                            <Widget title="Gamification" icon="fas fa-gamepad" gridColumn="span 2">
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                    <p><strong>Level:</strong> {level}</p>
                                    <div style={{width: '100%', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', height: 12, overflow: 'hidden'}}>
                                        <div style={{width: `${xpProgress}%`, height: '100%', background: 'var(--primary-color)', borderRadius: 'var(--radius)'}}></div>
                                    </div>
                                    <p style={{textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{Math.floor(xp)} / {xpToNextLevel} XP</p>
                                </div>
                            </Widget>
                             <Widget title="Quick Launch" icon="fas fa-rocket">
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                    <button onClick={() => onProcessUserMessage("open calculator")} className="focus-ring" style={{textAlign: 'left', background: 'var(--bg-tertiary)', border:'none', padding: '0.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-primary)'}}>Calculator</button>
                                    <button onClick={() => onProcessUserMessage("open code editor")} className="focus-ring" style={{textAlign: 'left', background: 'var(--bg-tertiary)', border:'none', padding: '0.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-primary)'}}>Code Editor</button>
                                </div>
                            </Widget>
                            <Widget title="Weather" icon="fas fa-cloud-sun">
                                <div style={{textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '1rem'}}>
                                    <p>Weather data unavailable.</p>
                                    <button onClick={() => onProcessUserMessage("What's the weather?")} style={{marginTop: '0.5rem', background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius)', cursor: 'pointer'}}>Ask AI</button>
                                </div>
                            </Widget>
                            <Widget title="Active Quests" icon="fas fa-scroll" gridColumn="span 2">
                                {activeQuests.length > 0 ? activeQuests.map(q => (
                                    <div key={q.id} style={{paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem'}}>
                                        <p style={{fontWeight: 600}}>{q.title}</p>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{q.description}</p>
                                        <p style={{fontSize: '0.8rem'}}>Progress: {q.progress}/{q.goal}</p>
                                    </div>
                                )) : <p style={{color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '1rem'}}>No active quests.</p>}
                            </Widget>
                            <Widget title="Recent Chats" icon="fas fa-comments" gridColumn="span 2">
                                 {recentMessages.map(msg => (
                                    <p key={msg.id} style={{fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                        <strong>{msg.sender === 'user' ? 'You:' : 'A.R.I.A.:'}</strong> {msg.text}
                                    </p>
                                 ))}
                            </Widget>
                        </div>
                    </div>
                );
            }
            case 'app-launcher': {
                const appsByCategory = {
                    'Productivity': [
                        { name: 'Calculator', icon: 'fas fa-calculator', description: 'Perform calculations.' },
                        { name: 'Notes', icon: 'fas fa-sticky-note', description: 'Create a secure note.' },
                        { name: 'Focus Mode', icon: 'fas fa-brain', description: 'Start a focus session.' },
                        { name: 'Translator', icon: 'fas fa-language', description: 'Translate text.' },
                        { name: 'File Cabinet', icon: 'fas fa-folder-open', description: 'Manage your files.' },
                        { name: 'Secure Photo', icon: 'fas fa-shield-alt', description: 'Create a secure photo.' },
                    ],
                    'Creative': [
                        { name: 'Image Generator', icon: 'fas fa-paint-brush', description: 'Create AI images.' },
                        { name: 'Whiteboard', icon: 'fas fa-chalkboard', description: 'Collaborate and draw.' },
                        { name: 'Sound Mixer', icon: 'fas fa-sliders-h', description: 'Mix ambient sounds.' },
                    ],
                    'System': [
                         { name: 'Activity Log', icon: 'fas fa-history', description: 'View system events.' },
                         { name: 'Code Editor', icon: 'fas fa-code', description: 'Write and edit code.' },
                         { name: 'Workflow Automator', icon: 'fas fa-project-diagram', description: 'Automate tasks.' },
                         { name: 'Browser', icon: 'fas fa-globe', description: 'Browse the web.' },
                    ],
                    'Entertainment': [
                        { name: 'Game Hub', icon: 'fas fa-trophy', description: 'Track your progress.' },
                        { name: 'Tic-Tac-Toe', icon: 'fas fa-gamepad', description: 'Play a classic game.' },
                    ]
                };

                const filteredApps = Object.entries(appsByCategory).reduce((acc, [category, apps]) => {
                    const filtered = apps.filter(app => app.name.toLowerCase().includes(appLauncherSearch.toLowerCase()));
                    if (filtered.length > 0) acc[category] = filtered;
                    return acc;
                }, {} as typeof appsByCategory);

                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <div style={{padding: '0.75rem', borderBottom: '1px solid var(--border-color)'}}>
                             <input 
                                type="search"
                                placeholder="Search for an app..."
                                value={appLauncherSearch}
                                onChange={e => setAppLauncherSearch(e.target.value)}
                                className="focus-ring"
                                style={{
                                    width: '100%', padding: '0.75rem', border: '1px solid var(--input-border)',
                                    borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)'
                                }}
                            />
                        </div>
                        <div className="custom-scrollbar" style={{flex: 1, overflowY: 'auto', padding: '1rem'}}>
                            {Object.entries(filteredApps).map(([category, apps]) => (
                                <div key={category} style={{marginBottom: '1.5rem'}}>
                                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem'}}>{category}</h3>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem'}}>
                                        {apps.map(app => (
                                            <button 
                                                key={app.name} 
                                                onClick={() => onProcessUserMessage(`open ${app.name.toLowerCase()}`)}
                                                className="focus-ring"
                                                style={{
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'left',
                                                    cursor: 'pointer', color: 'var(--text-primary)',
                                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <i className={app.icon} style={{fontSize: '1.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem'}}></i>
                                                <p style={{fontWeight: 600}}>{app.name}</p>
                                                <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{app.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
             case 'activity-log':
                return (
                    <div className="custom-scrollbar" style={{height: '100%', overflowY: 'auto', padding: '0.5rem'}}>
                        <div style={{position: 'relative', padding: '1rem 0'}}>
                          <div style={{position: 'absolute', left: '1.5rem', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--border-color)'}}></div>
                          {messages
                              .filter(m => m.source !== 'system-greeting')
                              .map(msg => {
                                  const { icon, color } = getIconForSource(msg.sender, msg.source);
                                  return (
                                      <div key={msg.id} style={{position: 'relative', paddingLeft: '3rem', marginBottom: '1rem'}}>
                                          <div style={{position: 'absolute', left: '1.5rem', top: '0.25rem', width: '1rem', height: '1rem', background: color, borderRadius: '50%', transform: 'translateX(-50%)', border: '2px solid var(--window-bg)'}}></div>
                                          <p style={{fontSize: '0.8rem', lineHeight: 1.4, wordBreak: 'break-word', color: 'var(--text-primary)'}}>
                                            <i className={icon} style={{color: color, marginRight: '0.5rem'}}></i>
                                            {msg.text}
                                          </p>
                                          <span style={{fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block'}}>
                                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                      </div>
                                  );
                          })}
                        </div>
                        {messages.filter(m => m.source !== 'system-greeting').length === 0 && (
                            <p style={{textAlign:'center', color:'var(--text-secondary)', paddingTop:'2rem', fontSize:'0.875rem'}}>No activity recorded yet.</p>
                        )}
                    </div>
                );
            case 'browser':
                const handleBrowserNav = (e?: React.FormEvent) => {
                    e?.preventDefault();
                    let url = browserUrlInput.trim();
                    if (url === '') return;
                    const isProbablyUrl = url.includes('.') || url.startsWith('http') || url.includes('localhost');
                    if (!isProbablyUrl) {
                        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = `https://${url}`;
                    }
                    onWindowInternalStateChange(window.id, { browserUrl: url });
                };
                const browserIframeSrc = window.internalState?.browserUrl || 'about:blank';

                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <form onSubmit={handleBrowserNav} style={{ display: 'flex', padding: '0.5rem', gap: '0.5rem', flexShrink: 0, borderBottom: '1px solid var(--border-color)' }}>
                            <input
                                type="text" value={browserUrlInput} onChange={e => setBrowserUrlInput(e.target.value)}
                                placeholder="Search or enter address"
                                style={{
                                    flexGrow: 1, padding: '0.5rem', border: '1px solid var(--input-border)',
                                    borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)'
                                }}
                                className="focus-ring"
                            />
                        </form>
                        <iframe
                            src={browserIframeSrc} title="Browser" style={{ flexGrow: 1, border: 'none', background: '#fff' }}
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                        />
                    </div>
                );
            case 'code-editor':
                 const componentId = `code-editor-textarea-${window.id}`;
                const component = window.components.find(c => c.id === componentId);
                const value = component?.value || '';
                return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background:'var(--bg-secondary)' }}>
                        <div style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)'}}>
                            <button className="icon-button focus-ring" title="Explain Code" onClick={() => onProcessUserMessage(`Explain the code in the editor.`)}><i className="fas fa-comment-alt"></i></button>
                            <button className="icon-button focus-ring" title="Debug Code" onClick={() => onProcessUserMessage(`Debug the code in the editor.`)}><i className="fas fa-bug"></i></button>
                            <button className="icon-button focus-ring" title="Optimize Code" onClick={() => onProcessUserMessage(`Optimize the code in the editor.`)}><i className="fas fa-rocket"></i></button>
                        </div>
                        <textarea
                            value={value} onChange={(e) => onComponentValueChange(componentId, e.target.value)}
                            placeholder="Write your code here..." className="custom-scrollbar focus-ring"
                            style={{
                                width: '100%', height: '100%', flexGrow: 1, padding: '0.5rem',
                                border: 'none', background: 'transparent', color: 'var(--input-text)',
                                resize: 'none', fontFamily: '"Fira Code", "Courier New", monospace',
                                fontSize: '0.9rem', outline: 'none', tabSize: 4,
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
                            }}
                        />
                    </div>
                );
            case 'calculator':
                const calcState = window.internalState || {};
                const displayValue = calcState.displayValue || '0';
                const buttons = [
                    { l: 'C', v: 'clear', s: {gridColumn: 'span 2'}, style: 'operator' }, { l: '÷', v: 'divide', style: 'operator' }, { l: '×', v: 'multiply', style: 'operator' },
                    { l: '7', v: '7' }, { l: '8', v: '8' }, { l: '9', v: '9' }, { l: '−', v: 'subtract', style: 'operator' },
                    { l: '4', v: '4' }, { l: '5', v: '5' }, { l: '6', v: '6' }, { l: '+', v: 'add', style: 'operator' },
                    { l: '1', v: '1' }, { l: '2', v: '2' }, { l: '3', v: '3' },
                    { l: '=', v: 'equals', s: {gridRow: 'span 2'}, style: 'operator' },
                    { l: '0', v: '0', s: { gridColumn: 'span 2' } },
                    { l: '.', v: 'decimal' }
                ];
                const buttonActionMap: { [key: string]: UIComponent['action'] } = {
                    clear: 'calculator:clear', divide: 'calculator:operator', multiply: 'calculator:operator',
                    subtract: 'calculator:operator', add: 'calculator:operator', equals: 'calculator:equals',
                    decimal: 'calculator:decimal'
                };
                return (
                    <div style={{ height: '100%', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ padding: '0.5rem 1rem', background: 'transparent', borderRadius: 'var(--radius)', textAlign: 'right', fontSize: '2.5rem', fontWeight: '300', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
                            {displayValue}
                        </div>
                        <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                            {buttons.map(btn => (
                                <button key={btn.l} onClick={() => {
                                    const action = buttonActionMap[btn.v] || 'calculator:digit';
                                    const value = action.endsWith('operator') ? btn.l : btn.v;
                                    onComponentAction({ action, value } as any, window.id)
                                }}
                                    style={{ 
                                        fontSize: '1.2rem', 
                                        border: 'none', 
                                        borderRadius: 'var(--radius)', 
                                        background: btn.style === 'operator' ? 'var(--primary-color)' : 'var(--bg-tertiary)', 
                                        color: btn.style === 'operator' ? 'var(--bg-primary)' : 'var(--text-primary)', 
                                        cursor: 'pointer',
                                        ...btn.s 
                                    }}
                                    className="focus-ring"
                                >{btn.l}</button>
                            ))}
                        </div>
                    </div>
                );
            case 'encrypted-note': {
                if (!secureNote) {
                    return <div style={{padding: '1rem', color: 'var(--text-secondary)'}}>Loading item...</div>;
                }
                const isLocked = secureNote.isLocked;
                const requiresPassword = secureNote.password === null;
                const error = window.internalState?.error;
                
                const getActionButton = () => {
                    if (requiresPassword) return { text: 'Set Password', action: 'encrypted-note:set_password' };
                    if (isLocked) return { text: 'Unlock', action: 'encrypted-note:unlock' };
                    return null;
                };
                const actionButton = getActionButton();

                if (isLocked || requiresPassword) {
                     return (
                         <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '1rem'}}>
                             <i className={`fas ${secureNote.type === 'photo' ? 'fa-image' : 'fa-file-alt'} fa-3x`} style={{color: 'var(--text-secondary)'}}></i>
                             <h4 style={{fontWeight: 600, color: 'var(--text-primary)'}}>{secureNote.name}</h4>
                             <p style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{requiresPassword ? 'This item needs a password.' : 'This item is locked.'}</p>
                            <input
                                id={`password-input-${window.id}`}
                                type="password"
                                placeholder="Enter password"
                                value={window.internalState?.passwordAttempt || ''}
                                onChange={e => onComponentValueChange(`password-input-${window.id}`, e.target.value)}
                                style={{padding: '0.5rem', border: `1px solid ${error ? '#ef4444' : 'var(--input-border)'}`, borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)', width:'80%'}}
                                className="focus-ring"
                            />
                            {error && <p style={{color: '#ef4444', fontSize: '0.8rem'}}>{error}</p>}
                            {actionButton &&
                                <button
                                    onClick={() => onComponentAction({ action: actionButton.action } as any, window.id)}
                                    style={{padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer'}}
                                    className="focus-ring"
                                >
                                    {actionButton.text}
                                </button>
                            }
                         </div>
                     );
                }

                // Unlocked view
                const decryptedContent = secureNote.type === 'note' 
                    ? (secureNote.password ? xorCipher(secureNote.encryptedContent || '', secureNote.password) : '')
                    : (secureNote.password ? xorCipher(secureNote.encryptedImageDataUri || '', secureNote.password) : '');

                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '0 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem'}}>
                           <h4 style={{fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{secureNote.name}</h4>
                           <button className="icon-button focus-ring" title="Lock Note" onClick={() => onComponentAction({action: 'encrypted-note:lock'} as any, window.id)}><i className="fas fa-lock-open"></i></button>
                        </div>
                        <div className="custom-scrollbar" style={{flex: 1, overflow: 'auto', padding: '0.5rem'}}>
                           {secureNote.type === 'note' ? (
                               <textarea
                                   id={`note-content-${window.id}`}
                                   value={decryptedContent}
                                   onChange={(e) => onComponentValueChange(`note-content-${window.id}`, e.target.value)}
                                   style={{width:'100%', height:'100%', border: 'none', backgroundColor: 'transparent', color: 'var(--input-text)', resize: 'none', fontFamily: 'inherit', outline: 'none'}}
                                   className="custom-scrollbar"
                                   placeholder="Your thoughts, secured..."
                               />
                           ) : (
                                <img src={decryptedContent} alt={secureNote.name} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius)'}} />
                           )}
                        </div>
                    </div>
                );
            }
            case 'secure-photo-creator': {
                const state = window.internalState || {};
                const error = state.error;

                const processDroppedFile = async (file: File) => {
                    if (file && file.type.startsWith('image/')) {
                        try {
                            const imageDataUri = await fileToDataUri(file);
                            onWindowInternalStateChange(window.id, {
                                status: 'awaiting_password',
                                imagePreviewUrl: imageDataUri,
                                imageData: imageDataUri,
                                error: null,
                            });
                        } catch (e) {
                            onWindowInternalStateChange(window.id, { error: "Failed to read dropped image." });
                        }
                    } else {
                        onWindowInternalStateChange(window.id, { error: "Invalid file type. Please drop an image." });
                    }
                };

                const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault(); e.stopPropagation();
                    processDroppedFile(e.dataTransfer.files[0]);
                };
                const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

                if (state.status === 'awaiting_image') {
                    return (
                        <div 
                            onDrop={handleDrop} 
                            onDragOver={handleDragOver}
                            style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '1rem', border: '2px dashed var(--border-color)', margin: '1rem', borderRadius: 'var(--radius)'}}>
                            <i className="fas fa-image fa-3x" style={{color: 'var(--text-secondary)'}}></i>
                            <h4 style={{fontWeight: 600, color: 'var(--text-primary)'}}>Add an Image</h4>
                            <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', textAlign: 'center'}}>Drag & drop a file here,<br/> or paste an image from your clipboard.</p>
                            {error && <p style={{color: '#ef4444', fontSize: '0.8rem', marginTop:'0.5rem'}}>{error}</p>}
                        </div>
                    );
                }
                
                if (state.status === 'awaiting_password' || state.status === 'saving') {
                    return (
                        <div style={{height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem'}}>
                            <div style={{flex: 1, minHeight: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                {state.imagePreviewUrl && <img src={state.imagePreviewUrl} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} />}
                            </div>
                            <input
                                id={`password-input-${window.id}`}
                                type="password"
                                placeholder="Enter password to encrypt"
                                value={state.passwordAttempt || ''}
                                onChange={e => onComponentValueChange(`password-input-${window.id}`, e.target.value)}
                                style={{padding: '0.5rem', border: `1px solid ${error ? '#ef4444' : 'var(--input-border)'}`, borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)'}}
                                className="focus-ring"
                                disabled={state.status === 'saving'}
                            />
                            {error && <p style={{color: '#ef4444', fontSize: '0.8rem'}}>{error}</p>}
                            <button
                                onClick={() => onSaveSecurePhoto(window.id, state.noteName || 'New Photo', state.imageData || '', state.passwordAttempt || '')}
                                disabled={!state.passwordAttempt || state.status === 'saving'}
                                style={{padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}
                                className="focus-ring"
                            >
                                {state.status === 'saving' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                                {state.status === 'saving' ? 'Saving...' : 'Save & Encrypt'}
                            </button>
                        </div>
                    );
                }
                return null;
            }
            case 'tic-tac-toe': {
                const state = window.internalState;
                const board = state?.board || Array(9).fill(null);
                const status = state?.winner ? (state.winner === 'Draw' ? 'It\'s a Draw!' : `Winner: ${state.winner}`) : `Current Player: ${state?.currentPlayer}`;

                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '1rem'}}>
                        <p style={{fontWeight: 600, fontSize: '1.2rem'}}>{status}</p>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '300px', aspectRatio: '1 / 1'}}>
                           {board.map((cell, i) => (
                               <button 
                                   key={i} 
                                   onClick={() => onComponentAction({ action: 'tictactoe:move', value: String(i) } as any, window.id)}
                                   disabled={!!cell || !!state?.isGameOver || state?.currentPlayer === state?.aiMark}
                                   style={{border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: cell === 'X' ? 'var(--primary-color)' : '#fde047', borderRadius: 'var(--radius)', fontSize: '2rem', fontWeight: 'bold', cursor:'pointer'}}
                                   className="focus-ring"
                                >
                                {cell}
                               </button>
                           ))}
                        </div>
                    </div>
                );
            }
            case 'sound-mixer': {
                 return (
                     <div className="custom-scrollbar" style={{height: '100%', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                         {Object.entries(soundSources).map(([key, { name, icon }]) => {
                             const soundState = window.internalState?.sounds?.[key];
                             if (!soundState) return null;
                             return (
                                 <div key={key} style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                     <button 
                                        className="icon-button focus-ring" 
                                        onClick={() => onComponentAction({action:'sound-mixer:toggle', value: key} as any, window.id)}
                                        style={{width: 40, height: 40, background: soundState.playing ? 'var(--primary-color)':'var(--bg-tertiary)', color: soundState.playing ? 'white':'var(--text-primary)'}}
                                    >
                                        <i className={icon}></i>
                                     </button>
                                     <input 
                                        type="range"
                                        id={`volume-slider-${key}`}
                                        min={0} max={1} step={0.01}
                                        value={soundState.volume}
                                        onChange={e => onComponentValueChange(`volume-slider-${key}`, e.target.value)}
                                        style={{flex: 1, accentColor: 'var(--primary-color)'}}
                                        className="focus-ring"
                                     />
                                 </div>
                             )
                         })}
                     </div>
                 );
            }
            case 'image-generator': {
                const state = window.internalState;
                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem'}}>
                        <textarea
                            id={`prompt-textarea-${window.id}`}
                            value={state?.prompt || ''}
                            onChange={(e) => onComponentValueChange(`prompt-textarea-${window.id}`, e.target.value)}
                            placeholder="Describe the image you want to create..."
                            rows={3}
                            className="custom-scrollbar focus-ring"
                            style={{width: '100%', border: '1px solid var(--input-border)', borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)', padding: '0.5rem', resize: 'none'}}
                        />
                        <button
                           onClick={() => onComponentAction({action: 'image-generator:generate'} as any, window.id)}
                           disabled={state?.isGeneratingImage}
                           style={{padding: '0.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
                           className="focus-ring"
                        >
                           {state?.isGeneratingImage ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-paint-brush"></i> Generate</>}
                        </button>
                        <div style={{flex: 1, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-secondary)'}}>
                           {state?.isGeneratingImage && <p style={{color: 'var(--text-secondary)'}}>Creating magic...</p>}
                           {state?.imageGenError && <p style={{color: '#ef4444', padding: '1rem', textAlign: 'center'}}>{state.imageGenError}</p>}
                           {state?.generatedImage && <img src={state.generatedImage} alt={state.prompt} style={{width:'100%', height:'100%', objectFit: 'contain'}} />}
                        </div>
                    </div>
                );
            }
            case 'translator': {
                const state = window.internalState || {};
                const handleTranslate = () => onWindowInternalStateChange(window.id, {isTranslating: true});
                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem'}}>
                       <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                           <select value={state.fromLang || 'en'} onChange={e => onWindowInternalStateChange(window.id, {fromLang: e.target.value})} className="focus-ring" style={{flex:1, padding:'0.5rem', background:'var(--input-bg)', border:'1px solid var(--input-border)', borderRadius:'var(--radius)', color:'var(--input-text)'}}>
                               {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                           </select>
                           <i className="fas fa-arrow-right" style={{color: 'var(--text-secondary)'}}></i>
                           <select value={state.toLang || 'es'} onChange={e => onWindowInternalStateChange(window.id, {toLang: e.target.value})} className="focus-ring" style={{flex:1, padding:'0.5rem', background:'var(--input-bg)', border:'1px solid var(--input-border)', borderRadius:'var(--radius)', color:'var(--input-text)'}}>
                              {Object.entries(languages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                           </select>
                       </div>
                       <textarea value={state.inputText || ''} onChange={e => onWindowInternalStateChange(window.id, {inputText: e.target.value})} rows={4} placeholder="Enter text to translate..." className="custom-scrollbar focus-ring" style={{width:'100%', flex:1, border:'1px solid var(--input-border)', borderRadius:'var(--radius)', background:'var(--input-bg)', color:'var(--input-text)', padding:'0.5rem', resize:'none'}} />
                       <button onClick={handleTranslate} disabled={state.isTranslating} style={{padding:'0.5rem', background:'var(--primary-color)', color:'white', border:'none', borderRadius:'var(--radius)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}} className="focus-ring">
                          {state.isTranslating ? <><i className="fas fa-spinner fa-spin"></i> Translating...</> : 'Translate'}
                       </button>
                       <textarea value={state.translatedText || ''} readOnly rows={4} placeholder="Translation will appear here..." className="custom-scrollbar" style={{width:'100%', flex:1, border:'1px solid var(--border-color)', borderRadius:'var(--radius)', background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'0.5rem', resize:'none'}} />
                    </div>
                );
            }
             case 'whiteboard': {
                const state = window.internalState;
                return (
                    <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)'}}>
                       {state?.isGeneratingSvg && <p style={{color: 'var(--text-secondary)'}}>Drawing...</p>}
                       {state?.svgContent && <div style={{width:'100%', height:'100%'}} dangerouslySetInnerHTML={{__html: state.svgContent}}></div>}
                       {!state?.svgContent && !state?.isGeneratingSvg && <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem'}}>Whiteboard is ready.<br/>Try asking: "Draw a flowchart for making coffee."</p>}
                    </div>
                );
            }
             case 'file-cabinet': {
                const state = window.internalState || {};
                const files = state.files || [];
                const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const content = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            if (file.type.startsWith('image/')) {
                                reader.readAsDataURL(file);
                            } else {
                                reader.readAsText(file, 'UTF-8');
                            }
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = error => reject(error);
                        });
                        const newFile: ManagedFile = { id: uuidv4(), name: file.name, type: file.type, size: file.size, content: content };
                        onWindowInternalStateChange(window.id, { files: [...files, newFile] });
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                };
                return (
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem'}}>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} />
                        <button onClick={() => fileInputRef.current?.click()} style={{padding:'0.5rem', background:'var(--bg-tertiary)', color:'var(--text-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius)', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem'}} className="focus-ring">
                           <i className="fas fa-upload"></i> Upload File
                        </button>
                        <div style={{flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', overflowY: 'auto'}} className="custom-scrollbar">
                            {files.length === 0 ? <p style={{textAlign:'center', color:'var(--text-secondary)', padding:'2rem'}}>No files uploaded.</p> :
                                files.map(file => (
                                    <div key={file.id} style={{display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderBottom:'1px solid var(--border-color)'}}>
                                        <i className="fas fa-file-alt" style={{color:'var(--primary-color)'}}></i>
                                        <span style={{flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.9rem'}}>{file.name}</span>
                                        <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>{(file.size/1024).toFixed(1)} KB</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                );
            }
            case 'workflow-automator': {
                 const state = window.internalState || {};
                 return (
                     <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem'}}>
                         <textarea
                            id={`workflow-textarea-${window.id}`}
                            value={state.workflowContent || ''}
                            onChange={(e) => onComponentValueChange(`workflow-textarea-${window.id}`, e.target.value)}
                            placeholder={"# Example Workflow\nopen a calculator\nopen a note called 'Calculations'"}
                            className="custom-scrollbar focus-ring"
                            style={{flex: 1, width: '100%', border: '1px solid var(--input-border)', borderRadius: 'var(--radius)', background: 'var(--input-bg)', color: 'var(--input-text)', padding: '0.5rem', resize: 'none', fontFamily:'"Fira Code", monospace'}}
                         />
                         <button
                            onClick={() => onComponentAction({action: 'workflow:run'} as any, window.id)}
                            style={{padding: '0.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
                            className="focus-ring"
                         >
                            <i className="fas fa-play"></i> Run Workflow
                         </button>
                     </div>
                 );
            }
            case 'game-hub': {
                const state = gamificationState;
                const activeTab = window.internalState?.activeTab || 'dashboard';
                const tabs: {id: typeof activeTab, label: string, icon: string}[] = [
                    {id: 'dashboard', label: 'Dashboard', icon: 'fa-user-astronaut'},
                    {id: 'quests', label: 'Quests', icon: 'fa-scroll'},
                    {id: 'achievements', label: 'Achievements', icon: 'fa-trophy'},
                    {id: 'loot', label: 'Loot', icon: 'fa-box-open'},
                ];
                const xpProgress = (state.xp / state.xpToNextLevel) * 100;
                return (
                     <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <div style={{display:'flex', borderBottom: '1px solid var(--border-color)', padding: '0 0.5rem', gap:'0.25rem'}}>
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => onWindowInternalStateChange(window.id, {activeTab: tab.id})} style={{padding:'0.75rem 1rem', border:'none', background:'transparent', color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                                    <i className={`fas ${tab.icon}`}></i> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="custom-scrollbar" style={{flex:1, overflowY:'auto', padding:'1rem'}}>
                            {activeTab === 'dashboard' && (
                                <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                                    <div style={{textAlign:'center'}}>
                                        <p style={{color:'var(--text-secondary)'}}>Level</p>
                                        <p style={{fontSize:'3rem', fontWeight:'bold', color:'var(--primary-color)'}}>{state.level}</p>
                                    </div>
                                    <div>
                                        <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', display:'flex', justifyContent:'space-between'}}><span>XP Progress</span> <span>{Math.floor(state.xp)} / {state.xpToNextLevel}</span></p>
                                        <div style={{width:'100%', background:'var(--bg-tertiary)', borderRadius:'var(--radius)', height:12, overflow:'hidden'}}>
                                            <div style={{width:`${xpProgress}%`, height:'100%', background:'var(--primary-color)', borderRadius:'var(--radius)'}}></div>
                                        </div>
                                    </div>
                                    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1rem', textAlign:'center'}}>
                                        <div><p style={{color:'var(--text-secondary)'}}>Quests Done</p><p style={{fontSize:'1.5rem', fontWeight:600}}>{state.questsCompleted}</p></div>
                                        <div><p style={{color:'var(--text-secondary)'}}>Focus Sessions</p><p style={{fontSize:'1.5rem', fontWeight:600}}>{state.focusSessionsCompleted}</p></div>
                                        <div><p style={{color:'var(--text-secondary)'}}>Notes Written</p><p style={{fontSize:'1.5rem', fontWeight:600}}>{state.notesCreated}</p></div>
                                        <div><p style={{color:'var(--text-secondary)'}}>Code Lines</p><p style={{fontSize:'1.5rem', fontWeight:600}}>{state.linesOfCodeWritten}</p></div>
                                    </div>
                                </div>
                            )}
                             {activeTab === 'quests' && (
                                <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                                   {quests.length === 0 && <p style={{textAlign:'center', color:'var(--text-secondary)', padding:'2rem'}}>No quests available.</p>}
                                   {quests.map(q => (
                                     <div key={q.id} style={{padding:'0.75rem', border:'1px solid var(--border-color)', borderRadius:'var(--radius)', background: 'var(--bg-secondary)', opacity: q.completed ? 0.6 : 1}}>
                                         <p style={{fontWeight:600}}>{q.title} {q.completed && <i className="fas fa-check-circle" style={{color:'#4ade80'}}></i>}</p>
                                         <p style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{q.description}</p>
                                         <p style={{fontSize:'0.8rem'}}>Progress: {q.progress} / {q.goal}</p>
                                         <p style={{fontSize:'0.8rem'}}>Reward: {q.xpReward} XP</p>
                                     </div>
                                   ))}
                                </div>
                            )}
                            {activeTab === 'achievements' && (
                                <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                                   {achievements.map(a => (
                                     <div key={a.id} style={{display:'flex', gap:'1rem', alignItems:'center', padding:'0.75rem', border:'1px solid var(--border-color)', borderRadius:'var(--radius)', background: 'var(--bg-secondary)', opacity: a.unlocked ? 1 : 0.5}}>
                                         <div style={{width:40, height:40, borderRadius:'50%', background: a.unlocked ? a.color : 'var(--bg-tertiary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center'}}><i className={`fas ${a.icon}`}></i></div>
                                         <div>
                                            <p style={{fontWeight:600}}>{a.title}</p>
                                            <p style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{a.description}</p>
                                         </div>
                                     </div>
                                   ))}
                                </div>
                            )}
                             {activeTab === 'loot' && (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', height:'100%'}}>
                                    <i className="fas fa-box-open fa-4x" style={{color: gamificationState.unopenedLootChests > 0 ? 'var(--primary-color)' : 'var(--text-secondary)'}}></i>
                                    <p style={{fontSize:'1.2rem', fontWeight:600}}>Unopened Chests: {gamificationState.unopenedLootChests}</p>
                                    <button 
                                        onClick={() => onComponentAction({action: 'gamehub:open_chest'} as any, window.id)} 
                                        disabled={gamificationState.unopenedLootChests === 0}
                                        style={{padding: '0.5rem 1rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer'}}
                                    >Open Chest</button>
                                </div>
                            )}
                        </div>
                     </div>
                );
            }
            default:
                return window.components.map(renderComponent);
        }
    };

    return (
        <div
            ref={parentRef}
            className="animate-subtlePopIn"
            style={{
                position: 'absolute',
                left: `${window.rect.x}%`,
                top: `${window.rect.y}%`,
                width: `${window.rect.w}%`,
                height: `${window.rect.h}%`,
                minWidth: '250px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--window-bg)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                zIndex: window.zIndex || 1,
                pointerEvents: 'all',
                overflow: 'hidden',
                transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-out',
            }}
            onMouseDown={() => onBringToFront(window.id)}
        >
            <div className="resize-handle top-left" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}></div>
            <div className="resize-handle top-right" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}></div>
            <div className="resize-handle bottom-left" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}></div>
            <div className="resize-handle bottom-right" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}></div>
            <div className="resize-handle top" onMouseDown={(e) => handleResizeMouseDown(e, 'top')}></div>
            <div className="resize-handle bottom" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}></div>
            <div className="resize-handle left" onMouseDown={(e) => handleResizeMouseDown(e, 'left')}></div>
            <div className="resize-handle right" onMouseDown={(e) => handleResizeMouseDown(e, 'right')}></div>

            <header
                onMouseDown={handleMouseDownOnHeader}
                style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--window-header-bg)',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    flexShrink: 0,
                }}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', overflow: 'hidden'}}>
                    <i className={getIconForWindowType(window.windowType)}></i>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.title}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <button
                        onClick={handleClose}
                        className="icon-button window-control-button"
                        style={{padding:'0.25rem'}}
                        aria-label={`Close ${window.title} window`}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </header>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--window-bg)' }}>
                {renderWindowContent()}
            </div>
        </div>
    );
};

export default DynamicWindow;