



import React from 'react';
import { UIWindow, UICommand, UIComponent, ChatMessage, SecureNote, GamificationState, Quest, Achievement, LearnedData } from '../types';
import DynamicWindow from './DynamicWindow';

interface DynamicUIManagerProps {
    windows: UIWindow[];
    messages: ChatMessage[];
    secureNotes: SecureNote[];
    learnedData: LearnedData;
    gamificationState: GamificationState;
    quests: Quest[];
    achievements: Achievement[];
    onComponentAction: (component: UIComponent, windowId: string) => void;
    onWindowAction: (command: UICommand) => void;
    onBringToFront: (windowId: string) => void;
    onUpdateWindowRect: (windowId: string, newRect: UIWindow['rect']) => void;
    userMediaStream: MediaStream | null;
    onComponentValueChange: (componentId: string, newValue: string) => void;
    onWindowInternalStateChange: (windowId: string, newState: Partial<UIWindow['internalState']>) => void;
    onProcessUserMessage: (message: string) => void;
    onSaveSecurePhoto: (windowId: string, noteName: string, imageData: string, password: string) => void;
}

const DynamicUIManager: React.FC<DynamicUIManagerProps> = ({ 
    windows, 
    messages,
    secureNotes,
    learnedData,
    gamificationState,
    quests,
    achievements,
    onComponentAction, 
    onWindowAction, 
    onBringToFront,
    onUpdateWindowRect,
    userMediaStream,
    onComponentValueChange,
    onWindowInternalStateChange,
    onProcessUserMessage,
    onSaveSecurePhoto,
}) => {
    const visibleDesktopWindows = windows.filter(w => !w.isHidden && w.windowType !== 'focus-mode');
    const focusModeWindow = windows.find(w => w.windowType === 'focus-mode' && !w.isHidden);

    const findSecureNoteForWindow = (window: UIWindow) => {
        if (window.windowType !== 'encrypted-note' || !window.noteId) return undefined;
        return secureNotes.find(note => note.id === window.noteId);
    };

    return (
        <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                {visibleDesktopWindows.map(window => (
                    <DynamicWindow
                        key={window.id}
                        window={window}
                        messages={messages}
                        secureNote={findSecureNoteForWindow(window)}
                        learnedData={learnedData}
                        gamificationState={gamificationState}
                        quests={quests}
                        achievements={achievements}
                        onComponentAction={onComponentAction}
                        onWindowAction={onWindowAction}
                        onBringToFront={onBringToFront}
                        onUpdateWindowRect={onUpdateWindowRect}
                        userMediaStream={userMediaStream}
                        onComponentValueChange={onComponentValueChange}
                        onWindowInternalStateChange={onWindowInternalStateChange}
                        onProcessUserMessage={onProcessUserMessage}
                        onSaveSecurePhoto={onSaveSecurePhoto}
                    />
                ))}
            </div>
            {focusModeWindow && (
                 <DynamicWindow
                    key={focusModeWindow.id}
                    window={focusModeWindow}
                    messages={messages}
                    secureNote={findSecureNoteForWindow(focusModeWindow)}
                    learnedData={learnedData}
                    gamificationState={gamificationState}
                    quests={quests}
                    achievements={achievements}
                    onComponentAction={onComponentAction}
                    onWindowAction={onWindowAction}
                    onBringToFront={onBringToFront}
                    onUpdateWindowRect={onUpdateWindowRect}
                    userMediaStream={userMediaStream}
                    onComponentValueChange={onComponentValueChange}
                    onWindowInternalStateChange={onWindowInternalStateChange}
                    onProcessUserMessage={onProcessUserMessage}
                    onSaveSecurePhoto={onSaveSecurePhoto}
                />
            )}
        </>
    );
};

export default DynamicUIManager;