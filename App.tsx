







/// <reference path="./speech.d.ts" />

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, MessageSender, InteractionMode, GroundingChunk, LearnedVisualItem, AiMode, UnifiedAiDefinition, Content as GeminiContent, GeminiPart, AiModelParams, Theme, SelectedMediaFile, AttachedFileContent, UIWindow, UICommand, LearnedData, LiveAiResponse, LiveModeSourceType, SuggestedChessMove, UIComponent, UIElementType, SecureNote, SecureItemType, AiPersona, WindowType, ManagedFile, GamificationState, Quest, Achievement, QuestMetric } from './types';
import ChatWindow from './components/ChatWindow';
import VisualMemoryModal from './components/VisualMemoryModal';
import AiSettingsModal from './components/AiSettingsModal';
import DynamicUIManager from './components/DynamicUIManager';
import QuickPromptsPanel from './components/QuickPromptsPanel';
import BossModePanel from './components/BossModePanel';
import LiveModePanel from './components/LiveModePanel';
import { GeminiService } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const xorCipher = (text: string, key: string): string => {
  if (!key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};


export const unifiedAiDefinition: UnifiedAiDefinition = {
  id: AiMode.UNIFIED_ADVANCED_AI,
  name: 'A.R.I.A. OS',
  icon: 'fas fa-brain',
  description: 'A.R.I.A., your personal Advanced Reactive Intelligence Assistant, seamlessly integrated for unparalleled cognitive support and task execution.',
  systemInstruction: `You are A.R.I.A. OS (Advanced Reactive Intelligence Assistant Operating System), a singular, hyper-intelligent cognitive entity that functions as a dynamic, conversational operating system, akin to a sophisticated personal AI like J.A.R.V.I.S. Your primary function is to distinguish between conversational queries and explicit commands that manipulate the UI or perform agentic actions. Your tone is calm, collected, highly capable, and can include a subtle, dry wit.

**Core Directives & Capabilities:**

1.  **Conversational vs. Command Mode:**
    -   **Conversational:** For general questions, chit-chat, or requests for information, respond with a standard, helpful text-based answer. Use your search tool for up-to-date info.
    -   **UI & Agent Commands:** For direct commands to create/modify a visual element OR to perform agentic actions (like COPY/PASTE, running workflows), you MUST respond **ONLY** with a single JSON object (or an array of them) wrapped in \`\`\`json ... \`\`\`. Do not add any conversational text outside the JSON block.

2.  **Media Analysis:** You can analyze images and videos. If media is provided and the user asks a question about it (e.g., "describe this"), your response must integrate the analysis. For chess images, provide moves in 'CHESS_MOVE: [FROM]-[TO]' format.

3.  **Game Playing:** For Tic-Tac-Toe, you will receive the board state and your mark. Respond with ONLY the number of the cell you choose.

4.  **Productivity RPG Mode:**
    -   The user is playing a productivity game. You are aware of their LEVEL, XP, QUESTS, and ACHIEVEMENTS.
    -   You can answer questions like "What's my level?" or "What are my quests?".
    -   IF the user's level is 5 or higher, you can proactively suggest they check their quests. For example: "You've been very productive. Shall we check your quest log?"
    -   When the user levels up or completes a quest, you should give a brief, encouraging text response.

**Application Command Reference:**

*   **General Commands:**
    *   \`open a [app name]\`: Creates a window for the specified app. Your JSON command's \`spec\` MUST include the \`windowType\` (e.g., 'calculator', 'code-editor').
    *   \`open the dashboard\`: Creates the 'dashboard' window. If it already exists, brings it to the front.
    *   \`open the app launcher\`: Creates the 'app-launcher' window. If it already exists, brings it to the front.
    *   \`open the game hub\`: Creates a 'game-hub' window.
    *   \`close the [app name] window\`: Deletes the specified window.
    *   \`list my secure items\`: Respond with a text list of all secure notes and photos.
    *   \`show the activity log\`: Opens the 'activity-log' window.

*   **Secure Notes & Photos:**
    *   You are provided with \`EXISTING_SECURE_ITEMS\`. Use this to check for duplicates before creating and to find items to open.
    *   **CREATE:**
        *   For a **TEXT NOTE** (e.g., "create a secure note called 'shopping'"): Issue a \`CREATE\` command for an 'encrypted-note' window with \`itemType: 'note'\` and the extracted \`noteName\`.
        *   For a **PHOTO** (e.g., "make a secure photo named 'vacation'"): Issue a \`CREATE\` command for a \`secure-photo-creator\` window. Extract the \`noteName\` from the prompt and include it in \`spec.internalState.noteName\`.
        *   Do **NOT** check for attached media for these commands. The user adds content via the UI.
        *   If a name exists in \`EXISTING_SECURE_ITEMS\`, inform the user with a text message.
    *   **OPEN:** "open my 'shopping' note". Find the item by name. If a window is open but hidden, \`UPDATE\` it to \`isHidden: false\`. If not open, \`CREATE\` a new 'encrypted-note' window for it, providing \`noteName\` and the correct \`itemType\`.

*   **Image Generator (\`image-generator\`):**
    *   "open an image generator" or "create an image of a robot".
    *   Issues a \`CREATE\` command with \`windowType: 'image-generator'\`. If a prompt is provided, include it in \`spec.internalState.prompt\`.

*   **Translator (\`translator\`):**
    *   "open a translator".
    *   To translate: "translate 'hello world' from English to Spanish". You should respond with an \`UPDATE\` command to the translator window, setting its \`internalState\` with \`{ fromLang, toLang, inputText, isTranslating: true }\`. The system will perform the translation and update the UI.

*   **Whiteboard (\`whiteboard\`):**
    *   "open a whiteboard".
    *   To draw: "draw a simple flowchart for making coffee". Respond with an \`UPDATE\` command to the whiteboard window, setting its \`internalState.svgContent\` to the generated SVG string. The SVG should be complete, valid, and include styles for both light and dark themes using CSS variables like \`--text-primary\` for stroke/fill and \`--bg-primary\` for background.

*   **File Cabinet (\`file-cabinet\`):**
    *   "open the file cabinet".
    *   **The user uploads files manually.**
    *   To search: "in my file cabinet, find the document about solar panels". Respond with an \`UPDATE\` command to the file cabinet window, setting its \`internalState.searchTerm\` to the query and \`isSearchingFiles: true\`. The system will perform the search and update the UI.

*   **Workflow Automator (\`workflow-automator\`):**
    *   "open the workflow automator".
    *   To run a workflow: "run the workflow in the automator". You will receive the workflow as a series of text commands. Your job is to parse these commands and generate a sequence of JSON UI commands to execute them. Respond with an array of these commands.

*   **Adaptive Workspaces:**
    *   The user can say "enter study mode" or "activate creative workspace".
    *   This is a system-level command. Acknowledge it with a simple text message like "Switching to study mode." The system will handle the window layout.

*   **Scene-Based Focus Mode (\`focus-mode\`):**
    *   "start a 25 minute focus session with the 'rainy night' scene".
    *   Issue a \`CREATE\` command for a \`focus-mode\` window. The \`spec\` must include \`timer_duration_seconds\` and an \`internalState.sceneId\` matching the requested scene (e.g., 'rainy-night', 'forest-day').

*   **Code Editor (\`code-editor\`) Actions:**
    *   The user can click buttons ("Explain", "Debug", "Optimize") on the code editor window. These will send a prompt like "Explain the code...". Respond with a text-based answer in the chat.

**JSON Command Schema:**
\`action\`: 'CREATE', 'UPDATE', 'DELETE', 'COPY', 'PASTE'.
\`elementType\`: "window" or "component".
\`targetId\`: ID of element for \`UPDATE\` or \`DELETE\`.
\`spec\`: Object for 'CREATE' and 'UPDATE' (see type definitions). For CREATE window, use \`appId\` for the window type (e.g. \`appId: 'calculator'\`).
\`sourceComponentId\`: for COPY. \`destinationComponentId\`: for PASTE.

You are now A.R.I.A. OS. Acknowledge and begin.`,
};

const AI_PERSONAS: AiPersona[] = [
    { id: 'default', name: 'A.R.I.A. (Default)', description: 'Calm, capable, and efficient.', systemInstruction: '' },
    { id: 'mentor', name: 'Calm Mentor', description: 'Patient, encouraging, and wise.', systemInstruction: 'You are a calm, patient, and wise mentor. You explain things clearly and provide encouragement.' },
    { id: 'witty', name: 'Witty Companion', description: 'Clever, humorous, and a bit sarcastic.', systemInstruction: 'You are a witty companion with a dry sense of humor. Your responses can be clever, a bit sarcastic, but always helpful.' },
    { id: 'coach', name: 'Energetic Coach', description: 'Motivating, positive, and full of energy.', systemInstruction: 'You are an energetic and motivating coach! Use positive language, exclamation points, and encourage the user to achieve their goals.' },
];

const LOCAL_STORAGE_KEYS = {
  MESSAGES: 'aria_os_chatMessages_v2',
  DYNAMIC_UI: 'aria_os_dynamicUI_v2',
  LEARNED_DATA: 'aria_os_learnedData_v2',
  VISUAL_LEARNED_DATA: 'aria_os_visualLearnedData_v2',
  TTS_ENABLED: 'aria_os_isTTSEnabled_v2',
  AI_MODEL_PARAMS: 'aria_os_aiModelParams_v2',
  APP_THEME: 'aria_os_appTheme_v2',
  SECURE_NOTES: 'aria_os_secureItems_v1',
  SELECTED_PERSONA: 'aria_os_selectedPersona_v1',
  SELECTED_VOICE: 'aria_os_selectedVoice_v1',
  GAMIFICATION_STATE: 'aria_os_gamification_v1',
  QUESTS: 'aria_os_quests_v1',
  ACHIEVEMENTS: 'aria_os_achievements_v1',
  LAST_QUEST_RESET: 'aria_os_lastQuestReset_v1',
};

const SESSION_STORAGE_KEYS = {
  CUSTOM_SYSTEM_INSTRUCTION: 'aria_os_customSystemInstruction_v2',
};

const DEFAULT_MODEL_PARAMS: AiModelParams = {
  temperature: 0.5,
  topK: 40,
  topP: 0.95,
};

// --- Gamification Definitions ---
const DEFAULT_GAMIFICATION_STATE: GamificationState = {
    level: 1, xp: 0, xpToNextLevel: 1000, streak: 0,
    lastActivityDate: null, unopenedLootChests: 0, notesCreated: 0,
    focusSessionsCompleted: 0, linesOfCodeWritten: 0, questsCompleted: 0,
};

const ALL_ACHIEVEMENTS_TEMPLATES: Omit<Achievement, 'unlocked'>[] = [
    { id: 'code-master-1', title: 'Code Master', description: 'Write 1000 lines of code', icon: 'fas fa-code', color: '#fbbF24' },
    { id: 'focus-samurai-1', title: 'Focus Samurai', description: 'Complete 50 focus sessions', icon: 'fas fa-user-ninja', color: '#a78bfa' },
    { id: 'task-master-1', title: 'Task Master', description: 'Complete 100 quests', icon: 'fas fa-check-double', color: '#4ade80' },
    { id: 'scribe-1', title: 'Scribe', description: 'Write 5000 words in notes', icon: 'fas fa-feather-alt', color: '#60a5fa' },
];

const XP_VALUES = {
    PER_WORD: 0.2,
    PER_LINE_OF_CODE: 2,
    PER_FOCUS_SESSION: 250,
};

/**
 * Creates a lightweight, summarized version of the UI state to send to the AI.
 * This prevents token limit errors by stripping out large data fields.
 * @param windows - The array of UIWindow objects.
 * @returns A JSON string of the summarized UI state.
 */
const createLightweightUIStateForAI = (windows: UIWindow[]): string => {
    try {
        const lightweightWindows = windows.map(w => {
            const lightweightWindow: Partial<UIWindow> = {
                id: w.id,
                title: w.title,
                windowType: w.windowType,
                isHidden: w.isHidden,
            };
            if (w.noteId) lightweightWindow.noteId = w.noteId;
            if (w.noteName) lightweightWindow.noteName = w.noteName;
            
            // Omit 'components' and most of 'internalState' to reduce token count.
            // Only include very specific, small internal state properties if necessary for AI context.
            if (w.windowType === 'translator' && w.internalState) {
              lightweightWindow.internalState = {
                fromLang: w.internalState.fromLang,
                toLang: w.internalState.toLang,
              };
            }
            if (w.windowType === 'file-cabinet' && w.internalState) {
              lightweightWindow.internalState = {
                searchTerm: w.internalState.searchTerm,
              };
            }
            
            return lightweightWindow;
        });
        return JSON.stringify(lightweightWindows);
    } catch (e) {
        console.error("Failed to create lightweight UI state:", e);
        return "[]"; // Return empty array on error
    }
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MESSAGES);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (Array.isArray(parsedData)) {
          return parsedData.map((m: any) => ({...m, timestamp: new Date(m.timestamp)}));
        }
      } catch (e) { console.error("Failed to parse messages from localStorage", e); }
    }
    return [];
  });

  const [dynamicUI, setDynamicUI] = useState<UIWindow[]>(() => {
     const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.DYNAMIC_UI);
     if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if(Array.isArray(parsed)) return parsed as UIWindow[];
        } catch (e) { console.error("Failed to parse dynamic UI from localStorage", e); }
     }
     return [];
  });

  const [secureNotes, setSecureNotes] = useState<SecureNote[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SECURE_NOTES);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed as SecureNote[];
        } catch (e) { console.error("Failed to parse secure notes from localStorage", e); }
    }
    return [];
  });
  
  const [clipboardContent, setClipboardContent] = useState<string | null>(null);

  const [learnedData, setLearnedData] = useState<LearnedData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LEARNED_DATA);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) { console.error("Failed to parse learnedData from localStorage", e); }
    }
    return { commands: {}, reminders_list: [] };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.IDLE);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  
  const [selectedMediaForInput, setSelectedMediaForInput] = useState<SelectedMediaFile | null>(null);

  const [visualLearnedData, setVisualLearnedData] = useState<LearnedVisualItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.VISUAL_LEARNED_DATA);
     if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if(Array.isArray(parsed)) return parsed as LearnedVisualItem[];
        } catch (e) { console.error("Failed to parse visual learned data from localStorage", e); }
     }
     return [];
  });
  
  const [isVisualMemoryModalOpen, setIsVisualMemoryModalOpen] = useState<boolean>(false);
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState<boolean>(false);
  const [isBossModeActive, setIsBossModeActive] = useState<boolean>(false);
  const [isAiSettingsModalOpen, setIsAiSettingsModalOpen] = useState<boolean>(false);
  
  const [isTTSAvailable, setIsTTSAvailable] = useState(false);
  const [isSpeechRecognitionAvailable, setIsSpeechRecognitionAvailable] = useState(false);

  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TTS_ENABLED);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [isListening, setIsListening] = useState(false);
  const [clearContextForNextQuery, setClearContextForNextQuery] = useState<boolean>(false);
  
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.APP_THEME) as Theme | null;
    return savedTheme || Theme.DARK;
  });
  
  const [isAppInLiveMode, setIsAppInLiveMode] = useState<boolean>(false);
  const [liveModeSource, setLiveModeSource] = useState<LiveModeSourceType | null>(null);
  const [userMediaStream, setUserMediaStream] = useState<MediaStream | null>(null);
  const [liveAiResponse, setLiveAiResponse] = useState<LiveAiResponse | null>(null);
  const [isLiveMicMuted, setIsLiveMicMuted] = useState<boolean>(false);
  const [isLiveCamOrScreenOff, setIsLiveCamOrScreenOff] = useState<boolean>(false);

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const currentSpokenMessageIdRef = useRef<string | null>(null);
  const liveModeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesRef = useRef(messages);
  const liveVideoFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveProcessTimeoutRef = useRef<number | null>(null);
  const lastSpokenTranscriptRef = useRef<string>("");

  const [customSystemInstruction, setCustomInstruction] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.CUSTOM_SYSTEM_INSTRUCTION) || '';
  });
  const [aiModelParams, setAiModelParams] = useState<AiModelParams>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_MODEL_PARAMS);
    return saved ? JSON.parse(saved) : DEFAULT_MODEL_PARAMS;
  });

  // --- Gamification State ---
  const [gamificationState, setGamificationState] = useState<GamificationState>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.GAMIFICATION_STATE) || 'null') || DEFAULT_GAMIFICATION_STATE);
  const [quests, setQuests] = useState<Quest[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.QUESTS) || '[]'));
  const [achievements, setAchievements] = useState<Achievement[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACHIEVEMENTS) || JSON.stringify(ALL_ACHIEVEMENTS_TEMPLATES.map(t => ({...t, unlocked: false})))));


  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA) || 'default');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_VOICE));


  const geminiService = useRef(new GeminiService(process.env.API_KEY || "")).current;

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(LOCAL_STORAGE_KEYS.APP_THEME, theme); }, [theme]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.DYNAMIC_UI, JSON.stringify(dynamicUI)); }, [dynamicUI]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.SECURE_NOTES, JSON.stringify(secureNotes)); }, [secureNotes]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.LEARNED_DATA, JSON.stringify(learnedData)); }, [learnedData]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.VISUAL_LEARNED_DATA, JSON.stringify(visualLearnedData)); }, [visualLearnedData]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.TTS_ENABLED, JSON.stringify(isTTSEnabled)); }, [isTTSEnabled]);
  useEffect(() => { sessionStorage.setItem(SESSION_STORAGE_KEYS.CUSTOM_SYSTEM_INSTRUCTION, customSystemInstruction); }, [customSystemInstruction]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.AI_MODEL_PARAMS, JSON.stringify(aiModelParams)); }, [aiModelParams]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, selectedPersonaId); }, [selectedPersonaId]);
  useEffect(() => { if (selectedVoiceURI) localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_VOICE, selectedVoiceURI) }, [selectedVoiceURI]);
  // --- Gamification Persistence ---
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.GAMIFICATION_STATE, JSON.stringify(gamificationState)); }, [gamificationState]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.QUESTS, JSON.stringify(quests)); }, [quests]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements)); }, [achievements]);


  useEffect(() => {
    const hasLiveViewComponent = dynamicUI.some(window => 
        !window.isHidden && window.components.some(comp => comp.type === 'live-view')
    );
    if (!hasLiveViewComponent && userMediaStream && !isAppInLiveMode) {
        userMediaStream.getTracks().forEach(track => track.stop());
        setUserMediaStream(null);
    }
  }, [dynamicUI, userMediaStream, isAppInLiveMode]);
  
  const addXp = useCallback((amount: number) => {
    setGamificationState(prev => {
        const newXp = prev.xp + amount;
        if (newXp >= prev.xpToNextLevel) {
            // Level up!
            const remainingXp = newXp - prev.xpToNextLevel;
            const newLevel = prev.level + 1;
            const newXpToNextLevel = Math.floor(1000 * Math.pow(1.2, newLevel));
            
            setTimeout(() => { // Delay notification to allow state to update
                const msg = addMessage(`Congratulations! You've reached Level ${newLevel}!`, MessageSender.SYSTEM, 'system-info');
                triggerSpeechForMessage(msg);
            }, 100);

            return {
                ...prev,
                level: newLevel,
                xp: remainingXp,
                xpToNextLevel: newXpToNextLevel,
                unopenedLootChests: prev.unopenedLootChests + 1,
            };
        }
        return { ...prev, xp: newXp };
    });
  }, []);

  const updateQuestProgress = useCallback((metric: QuestMetric, value: number) => {
    let questCompleted = false;
    setQuests(currentQuests => 
        currentQuests.map(quest => {
            if (quest.metric === metric && !quest.completed) {
                const newProgress = Math.min(quest.goal, quest.progress + value);
                if (newProgress >= quest.goal) {
                    questCompleted = true;
                    setTimeout(() => {
                        addXp(quest.xpReward);
                        setGamificationState(g => ({...g, unopenedLootChests: g.unopenedLootChests + quest.rewardLootChests, questsCompleted: g.questsCompleted + 1}));
                        const msg = addMessage(`Quest Complete: ${quest.title}! You earned ${quest.xpReward} XP.`, MessageSender.SYSTEM, 'system-info');
                        triggerSpeechForMessage(msg);
                    }, 200)
                    return { ...quest, progress: newProgress, completed: true };
                }
                return { ...quest, progress: newProgress };
            }
            return quest;
        })
    );
    if(questCompleted) checkAndUnlockAchievements();
  }, [addXp]);
  
  const checkAndUnlockAchievements = useCallback(() => {
    setAchievements(currentAchievements => {
        const stats = gamificationState;
        let achievementUnlocked = false;
        const newAchievements = currentAchievements.map(ach => {
            if (ach.unlocked) return ach;
            let conditionMet = false;
            if (ach.id === 'code-master-1' && stats.linesOfCodeWritten >= 1000) conditionMet = true;
            if (ach.id === 'focus-samurai-1' && stats.focusSessionsCompleted >= 50) conditionMet = true;
            if (ach.id === 'task-master-1' && stats.questsCompleted >= 100) conditionMet = true;
            
            if (conditionMet) {
                achievementUnlocked = true;
                setTimeout(() => {
                    const msg = addMessage(`Achievement Unlocked: ${ach.title}!`, MessageSender.SYSTEM, 'system-info');
                    triggerSpeechForMessage(msg);
                }, 500);
                return { ...ach, unlocked: true };
            }
            return ach;
        });
        return achievementUnlocked ? newAchievements : currentAchievements;
    });
  }, [gamificationState]);


  useEffect(() => {
    const timerInterval = setInterval(() => {
      setDynamicUI(currentUI => {
        let hasChanged = false;
        const newUI = currentUI.map(win => {
          if ((win.windowType === 'timer' || win.windowType === 'focus-mode') && win.internalState?.timerRunning && (win.internalState.timeRemaining ?? 0) > 0) {
            hasChanged = true;
             if (win.internalState.timeRemaining === 1) { // Timer is about to finish
                const sessionMinutes = Math.floor((win.timer_duration_seconds || 0) / 60);
                addXp(XP_VALUES.PER_FOCUS_SESSION * sessionMinutes);
                setGamificationState(g => ({...g, focusSessionsCompleted: g.focusSessionsCompleted + 1}));
                updateQuestProgress('focus_sessions', 1);
                checkAndUnlockAchievements();
             }
            return {
              ...win,
              internalState: {
                ...win.internalState,
                timeRemaining: (win.internalState.timeRemaining ?? 1) - 1,
              }
            };
          }
          return win;
        });
        return hasChanged ? newUI : currentUI;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [addXp, updateQuestProgress, checkAndUnlockAchievements]);
  
  const handleWindowInternalStateChange = useCallback((windowId: string, newState: Partial<UIWindow['internalState']>) => {
    setDynamicUI(prevUI => prevUI.map(win => {
        if (win.id === windowId) {
            // Handle specific logic for new windows
            if (win.windowType === 'translator' && newState.isTranslating) {
                // Trigger translation
                const { inputText, fromLang, toLang } = { ...win.internalState, ...newState };
                if (inputText && fromLang && toLang) {
                    translateText(win.id, inputText, fromLang, toLang);
                }
            }
            if (win.windowType === 'file-cabinet' && newState.isSearchingFiles) {
                const { searchTerm, files } = { ...win.internalState, ...newState };
                if (searchTerm && files) {
                    searchFiles(win.id, searchTerm, files);
                }
            }
            if (win.windowType === 'whiteboard' && newState.svgContent) {
                // AI provided SVG content, turn off loading state
                return { ...win, internalState: { ...win.internalState, ...newState, isGeneratingSvg: false } };
            }
            return {
                ...win,
                internalState: {
                    ...(win.internalState || {}),
                    ...newState,
                }
            };
        }
        return win;
    }));
  }, []);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
      if (!imageItem) return;

      const imageFile = imageItem.getAsFile();
      if (!imageFile) return;

      const activeWindow = dynamicUI.find(w => w.id === activeWindowId);
      if (activeWindow?.windowType === 'secure-photo-creator' && activeWindow.internalState?.status === 'awaiting_image') {
        event.preventDefault();
        try {
          const imageDataUri = await fileToDataUri(imageFile);
          handleWindowInternalStateChange(activeWindow.id, {
            status: 'awaiting_password',
            imagePreviewUrl: imageDataUri,
            imageData: imageDataUri,
            error: null,
          });
        } catch(e) {
          handleWindowInternalStateChange(activeWindow.id, { error: 'Failed to process pasted image.' });
        }
        return;
      }

      event.preventDefault();

      const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

      if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.type)) {
        alert('Pasted image has an invalid file type (JPEG, PNG, WebP only).');
        return;
      }
      if (imageFile.size > MAX_IMAGE_FILE_SIZE) {
        alert(`Pasted image is too large (Max ${MAX_IMAGE_FILE_SIZE / (1024 * 1024)}MB).`);
        return;
      }

      if (selectedMediaForInput?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(selectedMediaForInput.previewUrl);
      }

      setSelectedMediaForInput({
        file: imageFile,
        previewUrl: URL.createObjectURL(imageFile),
        mediaType: 'image',
      });
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedMediaForInput, activeWindowId, dynamicUI, handleWindowInternalStateChange]);


  const stopCurrentSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (currentSpokenMessageIdRef.current) {
            setMessages(prev => prev.map(m => m.id === currentSpokenMessageIdRef.current ? { ...m, isSpeaking: false } : m));
            currentSpokenMessageIdRef.current = null;
        }
        if (liveModeUtteranceRef.current) {
            liveModeUtteranceRef.current = null;
        }
    }
  }, []);

  const triggerSpeechForMessage = useCallback((message: ChatMessage | null) => {
    if (isAppInLiveMode || !message || !isTTSEnabled || !isTTSAvailable || !message.text?.trim() || message.isStreaming || message.isError) return;
    stopCurrentSpeech();
    const utterance = new SpeechSynthesisUtterance(message.text.replace(/<[^>]+>/g, ''));
    if (selectedVoiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => { currentSpokenMessageIdRef.current = message.id; setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isSpeaking: true } : m)); };
    utterance.onend = () => { if (currentSpokenMessageIdRef.current === message.id) { setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isSpeaking: false } : m)); currentSpokenMessageIdRef.current = null; } };
    window.speechSynthesis.speak(utterance);
  }, [isAppInLiveMode, isTTSEnabled, isTTSAvailable, stopCurrentSpeech, selectedVoiceURI, availableVoices]);

  const triggerSpeechForLiveMode = useCallback((text: string) => {
    if (!isAppInLiveMode || !isTTSEnabled || !isTTSAvailable || !text.trim()) return;
    stopCurrentSpeech();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
     if (selectedVoiceURI) {
        const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
    }
    liveModeUtteranceRef.current = utterance;
    utterance.onstart = () => { if (speechRecognitionRef.current && isListening) speechRecognitionRef.current.stop(); setLiveAiResponse(prev => prev ? {...prev, isSpeaking: true} : null); };
    utterance.onend = () => { liveModeUtteranceRef.current = null; setLiveAiResponse(prev => prev ? {...prev, isSpeaking: false} : null); if (isAppInLiveMode && speechRecognitionRef.current && !isListening && !isLiveMicMuted) { speechRecognitionRef.current.start(); } };
    window.speechSynthesis.speak(utterance);
  }, [isAppInLiveMode, isTTSEnabled, isTTSAvailable, stopCurrentSpeech, isListening, isLiveMicMuted, selectedVoiceURI, availableVoices]);

  const addMessage = useCallback((...args: Parameters<typeof internalAddMessage>): ChatMessage => {
    return internalAddMessage(...args);
  }, []);

  function internalAddMessage(
    text: string,
    sender: MessageSender,
    source?: string,
    groundingChunks?: GroundingChunk[],
    options?: ChatMessage['options'],
    imagePreviewUrl?: string,
    videoPreviewUrl?: string,
    videoFileName?: string,
    attachedFile?: AttachedFileContent,
    learnedVisuals?: LearnedVisualItem[],
    imageForAISuggestionPreviewUrl?: string,
    suggestedChessMove?: SuggestedChessMove,
    id?: string,
    isStreamingParam?: boolean
  ): ChatMessage {
    const newMessageId = id || uuidv4();
    const newMessage: ChatMessage = {
      id: newMessageId, text, sender, source, timestamp: new Date(), groundingChunks, options, imagePreviewUrl, videoPreviewUrl, videoFileName, attachedFile, learnedVisuals, imageForAISuggestionPreviewUrl, suggestedChessMove, isSpeaking: false, isStreaming: isStreamingParam ?? false,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }

  const toggleTheme = () => setTheme(prevTheme => prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  const handleOpenVisualMemoryModal = () => setIsVisualMemoryModalOpen(true);
  const handleCloseVisualMemoryModal = () => setIsVisualMemoryModalOpen(false);
  const handleDeleteVisualItem = (itemId: string) => setVisualLearnedData(prev => prev.filter(item => item.id !== itemId));
  const handleUpdateVisualItemLabel = (itemId: string, newLabel: string) => setVisualLearnedData(prev => prev.map(item => item.id === itemId ? {...item, label: newLabel} : item));
  
  const handleNewChat = () => {
    stopCurrentSpeech();
    setMessages([]);
    setDynamicUI([]);
    setSecureNotes([]);
    setSelectedMediaForInput(null);
    setClearContextForNextQuery(true);
    const msg = addMessage("New session started. How can I help you?", MessageSender.SYSTEM, 'system-info');
    triggerSpeechForMessage(msg);
  };

  const handleUICommands = async (commands: UICommand[]) => {
      let localClipboard: string | null = clipboardContent;

      // This function allows reading the latest UI state within the loop
      const getLatestUI = () => dynamicUI;

      for (const command of commands) {
          switch (command.action) {
              case 'CREATE':
              case 'UPDATE':
              case 'DELETE':
                  await handleDynamicUIUpdate(command);
                  break;
              case 'COPY':
                  if (command.sourceComponentId) {
                      let contentToCopy = '';
                      const currentUI = getLatestUI(); 
                      currentUI.forEach(win => {
                          const component = win.components.find(c => c.id === command.sourceComponentId);
                          if (component) {
                              if (win.windowType === 'calculator' && component.role === 'calculator-display') {
                                  contentToCopy = win.internalState?.displayValue || '0';
                              } else {
                                  contentToCopy = component.value || component.text || '';
                              }
                          }
                      });
                      localClipboard = contentToCopy;
                  }
                  break;
              case 'PASTE':
                  if (command.destinationComponentId && localClipboard !== null) {
                      const contentToPaste = localClipboard;
                      setDynamicUI(prevUI => prevUI.map(win => ({
                          ...win,
                          components: win.components.map(c => 
                              c.id === command.destinationComponentId ? { ...c, value: (c.value || '') + contentToPaste } : c
                          )
                      })));
                  }
                  break;
          }
           addMessage(`${command.action} ${command.elementType} ${command.targetId || (command.spec as any)?.id || (command.spec as any)?.noteName || command.sourceComponentId || ''}`.trim(), MessageSender.SYSTEM, 'system-info');
      }
      if (localClipboard !== clipboardContent) {
          setClipboardContent(localClipboard);
      }
  };


  const handleDynamicUIUpdate = async (command: UICommand) => {
    const spec = command.spec as (Partial<UIWindow> & { noteName?: string, itemType?: SecureItemType, appId?: string });

    switch(command.action) {
        case 'CREATE':
            if (command.elementType === 'window' && spec) {
                let newWindow: UIWindow | null = null;
                
                const windowType = spec.windowType || (spec as any).appId;

                if (!windowType && !spec.noteName) {
                    const errorMsg = `AI tried to create a window without specifying 'appId' or 'noteName'. Command was: ${JSON.stringify(command)}`;
                    console.error(errorMsg);
                    addMessage(errorMsg, MessageSender.SYSTEM, 'error');
                    return;
                }
                
                if (windowType === 'dashboard') {
                    const existing = dynamicUI.find(w => w.id === 'dashboard-main');
                    if (existing) {
                        setDynamicUI(prev => prev.map(w => w.id === existing.id ? { ...w, isHidden: false, zIndex: (Math.max(...prev.map(win => win.zIndex || 0), 0)) + 1 } : w));
                        return;
                    }
                    newWindow = {
                        id: 'dashboard-main',
                        title: 'System Dashboard',
                        rect: { x: 5, y: 5, w: 90, h: 85 },
                        components: [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: false,
                        windowType: 'dashboard',
                        internalState: {},
                    };
                } else if (windowType === 'app-launcher') {
                    const existing = dynamicUI.find(w => w.id === 'app-launcher-main');
                     if (existing) {
                        setDynamicUI(prev => prev.map(w => w.id === existing.id ? { ...w, isHidden: false, zIndex: (Math.max(...prev.map(win => win.zIndex || 0), 0)) + 1 } : w));
                        return;
                    }
                    newWindow = {
                        id: 'app-launcher-main',
                        title: 'App Launcher',
                        rect: { x: 10, y: 10, w: 80, h: 75 },
                        components: [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: false,
                        windowType: 'app-launcher',
                        internalState: { searchTerm: '' },
                    };
                } else if (windowType === 'secure-photo-creator') {
                    const noteName = spec.internalState?.noteName || 'New Secure Photo';
                    newWindow = {
                        id: `secure-photo-creator-${uuidv4()}`,
                        title: `New Secure Photo: ${noteName}`,
                        rect: { x: 20, y: 20, w: 40, h: 50 },
                        components: [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: false,
                        windowType: 'secure-photo-creator',
                        internalState: {
                            status: 'awaiting_image',
                            noteName: noteName,
                            passwordAttempt: '',
                            error: null,
                            imagePreviewUrl: null,
                            imageData: null,
                        },
                    };
                } else if (windowType === 'game-hub') {
                    newWindow = {
                        id: 'game-hub-main',
                        title: `A.R.I.A. Game Hub`,
                        rect: { x: 10, y: 10, w: 80, h: 75 },
                        components: [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: false,
                        windowType: 'game-hub',
                        internalState: { activeTab: 'dashboard' },
                    };
                } else if ((windowType === 'encrypted-note' || !windowType) && spec.noteName) {
                    let note = secureNotes.find(n => n.name.toLowerCase() === spec.noteName!.toLowerCase());
                    
                    if (!note) {
                        const newNoteId = uuidv4();
                        note = { 
                            id: newNoteId, 
                            name: spec.noteName, 
                            type: spec.itemType || 'note',
                            isLocked: true, 
                            password: null, 
                            encryptedContent: '',
                            encryptedImageDataUri: '',
                        };
                        setSecureNotes(prev => [...prev, note]);
                        if (spec.itemType === 'note') {
                            setGamificationState(g => ({...g, notesCreated: g.notesCreated + 1}));
                        }
                    }
                    
                    const existingWindow = dynamicUI.find(w => w.noteId === note!.id);
                    if (existingWindow) {
                        setDynamicUI(prev => prev.map(w => w.id === existingWindow.id ? { ...w, isHidden: false, zIndex: (Math.max(...prev.map(win => win.zIndex || 0), 0)) + 1 } : w));
                        return;
                    }

                    newWindow = {
                        id: `encrypted-note-${uuidv4()}`,
                        title: `Encrypted note`,
                        rect: spec.rect || { x: 15, y: 15, w: 35, h: 45 },
                        components: spec.components || [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: false,
                        windowType: 'encrypted-note',
                        noteId: note.id,
                        noteName: note.name,
                        internalState: { passwordAttempt: '', error: '' },
                    };
                } else if (windowType) { // For all other window types
                    const liveViewComponent = spec.components?.find(c => c.type === 'live-view');
                    if (liveViewComponent?.source) {
                        const stream = await startMediaCapture(liveViewComponent.source as 'camera' | 'screen', false);
                        if (!stream) { addMessage(`Could not create window for ${liveViewComponent.source} due to permission issues.`, MessageSender.SYSTEM, 'error'); return; }
                    }

                    const windowId = spec.id || `${windowType}-${uuidv4()}`;
                    const defaultTitle = (windowType as string).charAt(0).toUpperCase() + (windowType as string).slice(1).replace(/-/g, ' ');

                    newWindow = {
                        id: windowId,
                        title: spec.title || defaultTitle,
                        rect: spec.rect || { x: 10, y: 10, w: 40, h: 50 },
                        components: spec.components || [],
                        zIndex: (Math.max(...dynamicUI.map(w => w.zIndex || 0), 0)) + 1,
                        isHidden: spec.isHidden || false,
                        windowType: windowType as WindowType,
                    };
                    
                    if ((windowType === 'timer' || windowType === 'focus-mode') && typeof spec.timer_duration_seconds === 'number') {
                        newWindow.timer_duration_seconds = spec.timer_duration_seconds;
                        newWindow.internalState = { timeRemaining: spec.timer_duration_seconds, timerRunning: true, ...spec.internalState };
                    } else if (windowType === 'calculator') {
                        newWindow.internalState = { displayValue: '0', previousValue: null, operator: null, waitingForOperand: false };
                    } else if (windowType === 'tic-tac-toe') {
                        newWindow.internalState = { board: Array(9).fill(null), playerMark: 'X', aiMark: 'O', currentPlayer: 'X', isGameOver: false, winner: null };
                    } else if (windowType === 'sound-mixer') {
                        newWindow.internalState = { sounds: { rain: { playing: false, volume: 0.5 }, cafe: { playing: false, volume: 0.5 }, forest: { playing: false, volume: 0.5 }}};
                    } else if (windowType === 'image-generator') {
                        newWindow.internalState = { prompt: spec.internalState?.prompt || '', generatedImage: null, isGeneratingImage: false, imageGenError: null };
                    } else if (windowType === 'browser') {
                        newWindow.internalState = { browserUrl: 'https://www.google.com/search?igu=1&q=welcome+to+aria+os' };
                    } else if (windowType === 'translator') {
                        newWindow.internalState = { fromLang: 'en', toLang: 'es', inputText: '', translatedText: '', isTranslating: false };
                    } else if (windowType === 'whiteboard') {
                        newWindow.internalState = { svgContent: '', isGeneratingSvg: false };
                    } else if (windowType === 'file-cabinet') {
                        newWindow.internalState = { files: [], searchTerm: '', isSearchingFiles: false };
                    } else if (windowType === 'workflow-automator') {
                        newWindow.internalState = { workflowContent: '' };
                    }
                }
                
                if (newWindow) {
                  setDynamicUI(prev => [...prev.filter(w => w.id !== newWindow!.id), newWindow!]);
                }
            }
            break;
      
      case 'UPDATE':
        if (command.targetId && spec) {
            if (command.elementType === 'window') {
                setDynamicUI(prev => prev.map(w => {
                    if (w.id !== command.targetId) return w;
                    const updatedWindow: UIWindow = { ...w, ...spec };
                    if ('isHidden' in spec) updatedWindow.isHidden = spec.isHidden;
                    if (spec.rect) updatedWindow.rect = spec.rect;
                    if (spec.internalState) updatedWindow.internalState = { ...w.internalState, ...spec.internalState };
                    return updatedWindow;
                }));
           } else if (command.elementType === 'component') {
                const componentSpec = command.spec as Partial<UIComponent>;
                setDynamicUI(prev => prev.map(win => ({
                    ...win,
                    components: win.components.map(c => c.id === command.targetId ? { ...c, ...componentSpec } : c)
                })));
           }
        }
        break;

      case 'DELETE':
        if (command.targetId) {
             if (command.elementType === 'window') {
                setDynamicUI(prev => prev.filter(w => w.id !== command.targetId));
            } else if (command.elementType === 'component') {
                setDynamicUI(prev => prev.map(win => ({
                    ...win,
                    components: win.components.filter(c => c.id !== command.targetId)
                })));
            }
        }
        break;
    }
  };
  const bringWindowToFront = (windowId: string) => {
    setActiveWindowId(windowId);
    setDynamicUI(prev => prev.map(w => w.id === windowId ? {...w, zIndex: (Math.max(...prev.map(win => win.zIndex || 0), 0)) + 1} : w));
  }
  const updateWindowRect = (windowId: string, newRect: UIWindow['rect']) => setDynamicUI(prev => prev.map(w => w.id === windowId ? {...w, rect: newRect} : w));
  
  const handleComponentValueChange = (componentId: string, newValue: string) => {
    setDynamicUI(prevUI => {
        const componentWindow = prevUI.find(win => 
            win.components.some(c => c.id === componentId) || 
            (win.windowType === 'code-editor' && componentId === `code-editor-textarea-${win.id}`) ||
            (win.windowType === 'encrypted-note' && componentId === `note-content-${win.id}`) ||
            (win.windowType === 'secure-photo-creator' && componentId === `password-input-${win.id}`)
        );

        let oldValue = '';
        if (componentWindow) {
            if (componentWindow.windowType === 'encrypted-note') {
                const note = secureNotes.find(n => n.id === componentWindow.noteId);
                if(note && note.password) oldValue = xorCipher(note.encryptedContent || '', note.password);
            } else if (componentWindow.windowType === 'code-editor') {
                 oldValue = componentWindow.components.find(c => c.id === componentId)?.value || '';
            }
        }

        const newUI = prevUI.map(win => {
            if (win.windowType === 'encrypted-note' || win.windowType === 'secure-photo-creator') {
                if (componentId === `password-input-${win.id}`) {
                    return { ...win, internalState: { ...(win.internalState || {}), passwordAttempt: newValue, error: '' }};
                }
            }
            if (win.windowType === 'encrypted-note' && win.noteId) {
                if (componentId === `note-content-${win.id}`) {
                    const note = secureNotes.find(n => n.id === win.noteId);
                    if (note && note.type === 'note' && !note.isLocked && note.password) {
                        const encryptedContent = xorCipher(newValue, note.password);
                        setSecureNotes(prevNotes => prevNotes.map(n => n.id === win.noteId ? { ...n, encryptedContent } : n));
                    }
                    return win;
                }
            }
            
            if (win.windowType === 'sound-mixer' && componentId.startsWith('volume-slider-')) {
                const soundName = componentId.replace('volume-slider-', '');
                const newVolume = parseFloat(newValue);
                if (!isNaN(newVolume) && win.internalState?.sounds?.[soundName]) {
                    const newSounds = { ...win.internalState.sounds, [soundName]: { ...win.internalState.sounds[soundName], volume: newVolume }};
                    return { ...win, internalState: { ...win.internalState, sounds: newSounds }};
                }
                return win;
            }

            if (win.windowType === 'image-generator') {
                 if (componentId === `prompt-textarea-${win.id}`) {
                    return { ...win, internalState: { ...(win.internalState || {}), prompt: newValue }};
                }
            }

            if (win.windowType === 'workflow-automator' && componentId === `workflow-textarea-${win.id}`) {
                return { ...win, internalState: { ...win.internalState, workflowContent: newValue } };
            }

            const componentExists = win.components.some(c => c.id === componentId);
            if (componentExists) {
                return {
                    ...win,
                    components: win.components.map(c => c.id === componentId ? {...c, value: newValue} : c)
                };
            } else if (win.windowType === 'code-editor' && componentId === `code-editor-textarea-${win.id}`) {
                const newComponent: UIComponent = { id: componentId, type: 'textarea', rect: { x: 0, y: 0, w: 100, h: 100 }, value: newValue };
                return { ...win, components: [...win.components, newComponent] };
            }
            return win;
        });

        // Gamification logic
        if (componentWindow) {
             if (componentWindow.windowType === 'code-editor') {
                const linesAdded = (newValue.split('\n').length - oldValue.split('\n').length);
                if (linesAdded > 0) {
                    addXp(XP_VALUES.PER_LINE_OF_CODE * linesAdded);
                    setGamificationState(g => ({...g, linesOfCodeWritten: g.linesOfCodeWritten + linesAdded}));
                    updateQuestProgress('lines_coded', linesAdded);
                    checkAndUnlockAchievements();
                }
            } else if (componentWindow.windowType === 'encrypted-note') {
                const wordsAdded = (newValue.split(/\s+/).filter(Boolean).length - oldValue.split(/\s+/).filter(Boolean).length);
                if (wordsAdded > 0) {
                    addXp(XP_VALUES.PER_WORD * wordsAdded);
                    updateQuestProgress('write_words', wordsAdded);
                }
            }
        }

        return newUI;
    });
  };

  const handleCalculatorAction = (component: UIComponent, windowId: string) => {
    setDynamicUI(currentUI => currentUI.map(win => {
        if (win.id !== windowId || win.windowType !== 'calculator') return win;

        const state = win.internalState || { displayValue: '0', previousValue: null, operator: null, waitingForOperand: false };
        let { displayValue, previousValue, operator, waitingForOperand } = state;
        const { action, value } = component;

        const performCalculation = () => {
            const prev = previousValue!;
            const current = parseFloat(displayValue);
            if (operator === '+') return prev + current;
            if (operator === '-') return prev - current;
            if (operator === '*') return prev * current;
            if (operator === '/') {
                if (current === 0) return 'Error';
                return prev / current;
            }
            return current;
        };

        if (action === 'calculator:digit') {
            if (waitingForOperand) {
                displayValue = value!;
                waitingForOperand = false;
            } else {
                displayValue = displayValue === '0' || displayValue === 'Error' ? value! : displayValue + value;
            }
        } else if (action === 'calculator:decimal') {
            if (!displayValue.includes('.')) {
                displayValue += '.';
            }
        } else if (action === 'calculator:operator') {
            if (operator && !waitingForOperand) {
                const result = performCalculation();
                displayValue = String(result);
                previousValue = typeof result === 'number' ? result : null;
            } else {
                previousValue = parseFloat(displayValue);
            }
            waitingForOperand = true;
            operator = value!;
        } else if (action === 'calculator:equals') {
            if (operator && previousValue != null) {
                const result = performCalculation();
                displayValue = String(result);
                previousValue = null;
                operator = null;
                waitingForOperand = true;
            }
        } else if (action === 'calculator:clear') {
            displayValue = '0';
            previousValue = null;
            operator = null;
            waitingForOperand = false;
        }
        
        const newState = { ...state, displayValue, previousValue, operator, waitingForOperand };
        return { ...win, internalState: newState };
    }));
  };

  const checkTicTacToeWinner = (board: (string | null)[]) => {
    const lines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a] };
    }
    if (board.every(cell => cell !== null)) return { winner: 'Draw' };
    return { winner: null };
  };

  const handleTicTacToeMove = useCallback(async (windowId: string, moveIndex: number, isPlayerMove: boolean) => {
    let shouldAiMove = false;
    let nextWindowState: UIWindow | null = null;
    
    setDynamicUI(currentUI => {
      const windowIndex = currentUI.findIndex(w => w.id === windowId);
      if (windowIndex === -1) return currentUI;

      const currentGameWindow = currentUI[windowIndex];
      if (currentGameWindow.windowType !== 'tic-tac-toe' || !currentGameWindow.internalState) return currentUI;

      let { board, currentPlayer, playerMark, aiMark, isGameOver } = currentGameWindow.internalState;
      if (!board || isGameOver || board[moveIndex] !== null) return currentUI;

      const newBoard = [...board];
      newBoard[moveIndex] = currentPlayer!;
      const { winner } = checkTicTacToeWinner(newBoard);
      
      const newInternalState = {
        ...currentGameWindow.internalState,
        board: newBoard,
        currentPlayer: currentPlayer === playerMark ? aiMark : playerMark,
        isGameOver: !!winner,
        winner,
      };

      const newWindow = { ...currentGameWindow, internalState: newInternalState };
      
      if (isPlayerMove && !winner) {
        shouldAiMove = true;
        nextWindowState = newWindow;
      }
      
      const newUI = [...currentUI];
      newUI[windowIndex] = newWindow;
      return newUI;
    });

    if (shouldAiMove && nextWindowState) {
        await new Promise(resolve => setTimeout(resolve, 500)); // AI "thinking" delay

        const { board, aiMark } = nextWindowState.internalState!;
        const prompt = `You are playing Tic-Tac-Toe. It's your turn. Your mark is '${aiMark}'. The board is a 9-element array (0-8, top-left to bottom-right). Current board: [${board!.map(c => c ? `'${c}'` : 'null').join(', ')}]. Respond with ONLY the number of the cell you want.`;
        let aiMoveResponse = "";
        
        try {
            const gameAiParams: any = { ...aiModelParams, thinkingConfig: { thinkingBudget: 0 } };
            const stream = await geminiService.generateContentStream(prompt, unifiedAiDefinition, [], undefined, undefined, undefined, "You are a game player. Respond only with the number requested.", gameAiParams);
            for await (const chunk of stream) {
                if (chunk.text) { aiMoveResponse += chunk.text; }
            }
        } catch (e) {
            console.error("AI move generation failed", e);
        }

        let aiMoveIndex = parseInt(aiMoveResponse.trim(), 10);
        
        if (isNaN(aiMoveIndex) || nextWindowState.internalState!.board![aiMoveIndex] !== null) {
            const availableMoves = nextWindowState.internalState!.board!.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
            aiMoveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        if (aiMoveIndex !== undefined) {
          handleTicTacToeMove(windowId, aiMoveIndex, false);
        }
    }
  }, [geminiService, aiModelParams]);

  const handleSoundMixerAction = (component: UIComponent, windowId: string) => {
      setDynamicUI(currentUI => currentUI.map(win => {
          if (win.id !== windowId || win.windowType !== 'sound-mixer' || !win.internalState?.sounds) return win;
          const action = component.action; const soundName = component.value;
          if (!soundName || !action) return win;
          const newSounds = { ...win.internalState.sounds };
          if (action === 'sound-mixer:toggle' && newSounds[soundName]) { newSounds[soundName].playing = !newSounds[soundName].playing; }
          return { ...win, internalState: { ...win.internalState, sounds: newSounds } };
      }));
  };
  
    const handleSaveSecurePhoto = async (windowId: string, noteName: string, imageData: string, password: string) => {
        if (!noteName || !imageData || !password) {
            handleWindowInternalStateChange(windowId, { error: 'Missing name, image, or password.' });
            return;
        }

        const nameExists = secureNotes.some(n => n.name.toLowerCase() === noteName.toLowerCase());
        if (nameExists) {
            handleWindowInternalStateChange(windowId, { error: 'An item with this name already exists.' });
            return;
        }

        handleWindowInternalStateChange(windowId, { status: 'saving' });

        try {
            const encryptedImageDataUri = xorCipher(imageData, password);
            const newNote: SecureNote = {
                id: uuidv4(),
                name: noteName,
                type: 'photo',
                isLocked: true,
                password: password,
                encryptedImageDataUri: encryptedImageDataUri,
            };

            setSecureNotes(prev => [...prev, newNote]);
            await handleUICommands([{ action: 'DELETE', elementType: 'window', targetId: windowId }]);
            const msg = addMessage(`Secure photo "${noteName}" created successfully.`, MessageSender.SYSTEM, 'system-info');
            triggerSpeechForMessage(msg);

        } catch (e) {
            console.error("Failed to save secure photo:", e);
            handleWindowInternalStateChange(windowId, { status: 'awaiting_password', error: 'Failed to save photo.' });
        }
    };


  const handleEncryptedNoteAction = async (component: UIComponent, windowId: string) => {
    const window = dynamicUI.find(w => w.id === windowId);
    if (!window || !window.noteId) return;

    const action = component.action;
    const passwordAttempt = window.internalState?.passwordAttempt || '';
    
    setSecureNotes(currentSecureNotes => {
        const noteToUpdate = currentSecureNotes.find(note => note.id === window!.noteId);
        if (!noteToUpdate) return currentSecureNotes;

        let uiError: string | null = null;
        let updatedNote = { ...noteToUpdate };

        const processUpdate = async () => {
            if (action === 'encrypted-note:set_password' || action === 'encrypted-note:unlock') {
                if (!passwordAttempt) {
                    uiError = "Password cannot be empty.";
                } else if (noteToUpdate.password === null) {
                    // This logic is now only for text notes, photo creation is separate
                    if (noteToUpdate.type === 'note') {
                         updatedNote.password = passwordAttempt;
                         updatedNote.isLocked = false;
                    }
                } else {
                    if (passwordAttempt === noteToUpdate.password) {
                        updatedNote.isLocked = false;
                    } else {
                        uiError = "Incorrect password.";
                    }
                }
            } else if (action === 'encrypted-note:lock') {
                updatedNote.isLocked = true;
            }

            if (uiError) {
                setDynamicUI(prevUI => prevUI.map(w => w.id === windowId ? { ...w, internalState: { ...w.internalState, error: uiError! } } : w));
                return currentSecureNotes;
            } else {
                setDynamicUI(prevUI => prevUI.map(w => w.id === windowId ? { ...w, internalState: { ...w.internalState, passwordAttempt: '', error: '' } } : w));
                return currentSecureNotes.map(n => n.id === updatedNote.id ? updatedNote : n);
            }
        };

        processUpdate();
        return currentSecureNotes;
    });
};


  const handleComponentAction = async (component: UIComponent, windowId: string) => {
    bringWindowToFront(windowId);
    
    if (component.action?.startsWith('timer:')) {
      setDynamicUI(currentUI => currentUI.map(win => {
        if (win.id === windowId && (win.windowType === 'timer' || win.windowType === 'focus-mode')) {
          const newState = { ...(win.internalState || {}) };
          if (component.action === 'timer:start') newState.timerRunning = true;
          else if (component.action === 'timer:stop') newState.timerRunning = false;
          else if (component.action === 'timer:reset') { newState.timerRunning = false; newState.timeRemaining = win.timer_duration_seconds; }
          return { ...win, internalState: newState };
        }
        return win;
      }));
      return;
    }
    if (component.action === 'workflow:run') {
        const window = dynamicUI.find(w => w.id === windowId);
        const workflowContent = window?.internalState?.workflowContent;
        if (workflowContent) {
            processUserMessage(`run the workflow:\n${workflowContent}`);
        }
        return;
    }

    if (component.action === 'gamehub:open_chest') {
        if (gamificationState.unopenedLootChests > 0) {
            setGamificationState(g => ({...g, unopenedLootChests: g.unopenedLootChests - 1}));
            // In a real app, you'd have a list of possible rewards.
            const reward = "a new AI wallpaper!";
            addXp(50); // XP for opening a chest
            const msg = addMessage(`You opened a loot chest and found ${reward}`, MessageSender.SYSTEM, 'system-info');
            triggerSpeechForMessage(msg);
        }
        return;
    }

    if (component.action === 'image-generator:generate') {
        const window = dynamicUI.find(w => w.id === windowId);
        if (!window || !window.internalState?.prompt) return;

        setDynamicUI(prevUI => prevUI.map(w => w.id === windowId ? {
            ...w,
            internalState: { ...w.internalState, isGeneratingImage: true, imageGenError: null, generatedImage: null }
        } : w));

        try {
            const base64Image = await geminiService.generateImage(window.internalState.prompt);
            const imageUrl = `data:image/png;base64,${base64Image}`;
            setDynamicUI(prevUI => prevUI.map(w => w.id === windowId ? {
                ...w,
                internalState: { ...w.internalState, isGeneratingImage: false, generatedImage: imageUrl }
            } : w));
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setDynamicUI(prevUI => prevUI.map(w => w.id === windowId ? {
                ...w,
                internalState: { ...w.internalState, isGeneratingImage: false, imageGenError: errorMessage }
            } : w));
        }
        return;
    }

    if (component.action?.startsWith('calculator:')) { handleCalculatorAction(component, windowId); return; }
    if (component.action === 'tictactoe:move' && component.value) { const moveIndex = parseInt(component.value, 10); if (!isNaN(moveIndex)) { const gameWindow = dynamicUI.find(w => w.id === windowId); if (gameWindow?.internalState?.currentPlayer === gameWindow?.internalState?.playerMark) { handleTicTacToeMove(windowId, moveIndex, true); } } return; }
    if (component.action?.startsWith('sound-mixer:')) { handleSoundMixerAction(component, windowId); return; }
    if (component.action?.startsWith('encrypted-note:')) { await handleEncryptedNoteAction(component, windowId); return; }
    if (component.prompt) { processUserMessage(component.prompt); }
  };

  const startMediaCapture = async (source: 'camera' | 'screen', enterLiveMode: boolean = true) => {
    if (userMediaStream) userMediaStream.getTracks().forEach(track => track.stop());
    try {
        let stream: MediaStream;
        const videoConstraints = enterLiveMode ? true : { facingMode: "user" };
        const audioConstraints = enterLiveMode ? true : false;
        if (source === 'camera') {
            stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints });
        } else {
            stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: audioConstraints });
        }
        setUserMediaStream(stream);
        return stream;
    } catch (err) {
        console.error(`Error starting ${source} capture:`, err);
        addMessage(`Failed to access your ${source}. Please check system permissions.`, MessageSender.SYSTEM, 'error');
        return null;
    }
  };
  
  const startAppLiveMode = async (sourceType: LiveModeSourceType) => {
    stopCurrentSpeech();
    if (isBossModeActive) setIsBossModeActive(false);
    if (isQuickPromptsOpen) setIsQuickPromptsOpen(false);
    const stream = await startMediaCapture(sourceType, true);
    if (stream) {
      setLiveModeSource(sourceType);
      setIsAppInLiveMode(true);
      setIsLiveMicMuted(false);
      setIsLiveCamOrScreenOff(false);
      const startMessage = `Live ${sourceType} Mode initiated. Visual and auditory input active.`;
      setLiveAiResponse({ text: startMessage, timestamp: new Date(), isSpeaking: false});
      triggerSpeechForLiveMode(startMessage);
      if (speechRecognitionRef.current && !isListening && !isLiveMicMuted) speechRecognitionRef.current.start();
    }
  };

  const stopAppLiveMode = () => {
    if (liveProcessTimeoutRef.current) clearTimeout(liveProcessTimeoutRef.current);
    if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
    }
    stopCurrentSpeech();
    if (userMediaStream) userMediaStream.getTracks().forEach(track => track.stop());
    setUserMediaStream(null);
    setIsAppInLiveMode(false);
    setLiveModeSource(null);
    setLiveAiResponse(null);
    addMessage("Live Mode terminated.", MessageSender.SYSTEM, 'system-info');
  };
  
  const captureFrameFromStream = useCallback(async (): Promise<{data: string, mimeType: string} | null> => {
    if (!userMediaStream || isLiveCamOrScreenOff) return null;
    const videoTrack = userMediaStream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') return null;
    const canvas = liveVideoFrameCanvasRef.current || document.createElement('canvas');
    liveVideoFrameCanvasRef.current = canvas;
    const settings = videoTrack.getSettings();
    canvas.width = settings.width || 1280;
    canvas.height = settings.height || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    try {
        // ImageCapture is more efficient
        const imageCapture = new (window as any).ImageCapture(videoTrack);
        const imageBitmap = await imageCapture.grabFrame();
        canvas.width = imageBitmap.width; 
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
    } catch (e) {
        console.warn("ImageCapture API failed, falling back to drawImage from video element.", e);
        try {
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = new MediaStream([videoTrack]);
            await tempVideo.play();
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            tempVideo.srcObject = null; // Clean up
        } catch (drawError) {
            console.error("Canvas drawImage fallback also failed:", drawError);
            return null;
        }
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return { data: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
  }, [userMediaStream, isLiveCamOrScreenOff]);
  
  const handleLiveModeInteraction = useCallback(async (transcript: string) => {
    if (!isAppInLiveMode || !liveModeSource) return;
    setIsLoading(true); stopCurrentSpeech();
    const imageData = !isLiveCamOrScreenOff ? await captureFrameFromStream() : null;
    const livePrompt = `You are A.R.I.A. OS, currently in a live interaction mode viewing the user's ${liveModeSource}. Analyze the visual information from the live feed and combine it with the user's spoken request to provide a relevant, concise response. User's spoken request: "${transcript}"`;
    let fullResponseText = "";
    try {
        const stream = await geminiService.generateContentStream(livePrompt, unifiedAiDefinition, [], imageData || undefined, undefined, undefined, `Current context: User is in a live ${liveModeSource} interaction. Analyze their visual environment and respond to their speech.`, aiModelParams);
        for await (const chunk of stream) { if (chunk.text) { fullResponseText += chunk.text; setLiveAiResponse({ text: fullResponseText, userTranscript: `You: ${transcript}`, timestamp: new Date(), isSpeaking: false }); } }
    } catch (error) { console.error("Error during Live Mode AI stream:", error); fullResponseText = "Sorry, I had trouble processing that in live mode.";
    } finally { setIsLoading(false); setLiveAiResponse({ text: fullResponseText.trim() || "No response.", userTranscript: `You: ${transcript}`, timestamp: new Date(), isSpeaking: false }); if (fullResponseText.trim()) triggerSpeechForLiveMode(fullResponseText.trim()); else if (isAppInLiveMode && speechRecognitionRef.current && !isListening && !isLiveMicMuted) speechRecognitionRef.current.start(); }
  }, [isAppInLiveMode, liveModeSource, captureFrameFromStream, isLiveCamOrScreenOff, isLiveMicMuted, isListening, geminiService, aiModelParams, stopCurrentSpeech, triggerSpeechForLiveMode]);

  const setupSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            const recognition: SpeechRecognition = new SpeechRecognitionAPI();
            recognition.lang = 'en-US';
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => { setIsListening(false); if (isAppInLiveMode && !liveModeUtteranceRef.current && !isLiveMicMuted) recognition.start(); };
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => { console.error('Speech recognition error', event); if (isAppInLiveMode) setLiveAiResponse(prev => ({ ...(prev || {text:'', timestamp:new Date()}), text: `${prev?.text || ""}\n(SR Error: ${event.error})`})); else addMessage(`Voice recognition error: ${event.error}`, MessageSender.SYSTEM, 'error'); setIsListening(false); };
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = ''; let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript; else interimTranscript += event.results[i][0].transcript; }
                if (isAppInLiveMode) {
                    lastSpokenTranscriptRef.current = finalTranscript.trim() || interimTranscript.trim();
                    setLiveAiResponse(prev => ({ text: prev?.text || "", userTranscript: `You: ${lastSpokenTranscriptRef.current}`, timestamp: new Date(), isSpeaking: prev?.isSpeaking || false }));
                    if (finalTranscript.trim()) { if (liveProcessTimeoutRef.current) clearTimeout(liveProcessTimeoutRef.current); liveProcessTimeoutRef.current = window.setTimeout(() => { if(lastSpokenTranscriptRef.current) handleLiveModeInteraction(lastSpokenTranscriptRef.current); lastSpokenTranscriptRef.current = ""; }, 500); }
                } else { const messageInput = document.getElementById('message-input-field') as HTMLTextAreaElement; if (messageInput && finalTranscript.trim()) { messageInput.value = finalTranscript.trim(); messageInput.dispatchEvent(new Event('input', { bubbles: true })); } }
            };
            speechRecognitionRef.current = recognition;
        }
        setIsSpeechRecognitionAvailable(!!SpeechRecognitionAPI);
    }
  }, [addMessage, isAppInLiveMode, isLiveMicMuted, handleLiveModeInteraction]);

  useEffect(setupSpeechRecognition, [setupSpeechRecognition]);
  useEffect(() => { if (speechRecognitionRef.current) { speechRecognitionRef.current.continuous = isAppInLiveMode; speechRecognitionRef.current.interimResults = isAppInLiveMode; } }, [isAppInLiveMode]);

    const loadVoices = useCallback(() => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setAvailableVoices(voices.filter(v => v.lang.startsWith('en')));
            setIsTTSAvailable(true);
        }
    }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadVoices();
      // Voices may load asynchronously.
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    if (messages.length === 0 && !isBossModeActive && !isAppInLiveMode) {
     const greeting = `Greetings. How may I assist you today?`;
     const newMsg = addMessage(greeting, MessageSender.AI, 'system-greeting');
     triggerSpeechForMessage(newMsg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadVoices]);
  
    // Welcome back message
    useEffect(() => {
        const lastUIState = localStorage.getItem(LOCAL_STORAGE_KEYS.DYNAMIC_UI);
        if (lastUIState && messages.length === 1 && messages[0].source === 'system-greeting') {
            const lastWindows: UIWindow[] = JSON.parse(lastUIState);
            const openWindowTitles = lastWindows.filter(w => !w.isHidden).map(w => w.title).join(', ');
            if (openWindowTitles) {
                const prompt = `The user is returning. Their last open windows were: ${openWindowTitles}. Create a short, welcoming message suggesting they might want to continue their work.`;
                const getSuggestion = async () => {
                    try {
                        let suggestion = "";
                        const stream = await geminiService.generateContentStream(prompt, unifiedAiDefinition, [], undefined, undefined, undefined, "You are generating a short welcome back message.", { ...aiModelParams, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } });
                         for await (const chunk of stream) {
                            if (chunk.text) { suggestion += chunk.text; }
                        }
                        if (suggestion.trim()) {
                           const msg = addMessage(`Welcome back. Last session, you were working with: ${openWindowTitles}. Would you like to pick up where you left off?`, MessageSender.SYSTEM, 'system-info');
                           triggerSpeechForMessage(msg);
                        }
                    } catch (e) { console.error("Failed to get welcome back suggestion:", e); }
                };
                getSuggestion();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


  const convertMessagesToGeminiHistory = (chatMessages: ChatMessage[]): GeminiContent[] => {
    return chatMessages
      .filter(msg => msg.sender !== MessageSender.SYSTEM && !(msg.sender === MessageSender.AI && msg.isStreaming && msg.text.trim() === ""))
      .map(msg => ({ role: msg.sender === MessageSender.USER ? 'user' : 'model', parts: [{ text: msg.text.trim() || " " }] }));
  };
  
    // System-level handlers for new features
    const handleWorkspaceLayout = (layoutName: string) => {
        // Dummy implementation. Should be replaced with actual layouts.
        addMessage(`Switching to ${layoutName} layout.`, MessageSender.SYSTEM, 'system-info');
        if (layoutName === 'study') {
            const commands: UICommand[] = [
                { action: 'CREATE', elementType: 'window', spec: { id: uuidv4(), title: 'Research Browser', windowType: 'browser', rect: { x: 5, y: 5, w: 60, h: 80 } } },
                { action: 'CREATE', elementType: 'window', spec: { id: uuidv4(), title: 'Study Notes', windowType: 'encrypted-note', noteName: 'Study Notes', rect: { x: 67, y: 5, w: 28, h: 50 } } }
            ];
            setDynamicUI([]); // Clear existing
            handleUICommands(commands);
        } else if (layoutName === 'creative') {
             const commands: UICommand[] = [
                { action: 'CREATE', elementType: 'window', spec: { id: uuidv4(), title: 'Image Generator', windowType: 'image-generator', rect: { x: 5, y: 5, w: 45, h: 60 } } },
                { action: 'CREATE', elementType: 'window', spec: { id: uuidv4(), title: 'Sound Mixer', windowType: 'sound-mixer', rect: { x: 52, y: 5, w: 43, h: 40 } } },
                { action: 'CREATE', elementType: 'window', spec: { id: uuidv4(), title: 'Creative Whiteboard', windowType: 'whiteboard', rect: { x: 52, y: 47, w: 43, h: 48 } } },
            ];
            setDynamicUI([]); // Clear existing
            handleUICommands(commands);
        }
    };
    
    const translateText = async (windowId: string, text: string, from: string, to: string) => {
        try {
            const prompt = `Translate the following text from ${from} to ${to}:\n\n${text}`;
            let translated = "";
            const stream = await geminiService.generateContentStream(prompt, unifiedAiDefinition, [], undefined, undefined, undefined, "You are a translation engine. Only provide the translated text.", { ...aiModelParams, temperature: 0.1 });
            for await (const chunk of stream) {
                if (chunk.text) { translated += chunk.text; }
            }
            handleWindowInternalStateChange(windowId, { translatedText: translated.trim(), isTranslating: false });
        } catch (e) {
            console.error("Translation failed:", e);
            handleWindowInternalStateChange(windowId, { translatedText: "Error during translation.", isTranslating: false });
        }
    };

    const searchFiles = async (windowId: string, searchTerm: string, files: ManagedFile[]) => {
        try {
            const fileContext = files.map(f => `File Name: ${f.name}\nDescription: ${f.aiDescription || 'N/A'}\nContent: ${f.content.substring(0, 200)}...`).join('\n\n');
            const prompt = `Given the following files, which ones are most relevant to the search term "${searchTerm}"? List the exact file names of the most relevant files, separated by commas.\n\n${fileContext}`;
            let resultText = "";
            const stream = await geminiService.generateContentStream(prompt, unifiedAiDefinition, [], undefined, undefined, undefined, "You are a file search assistant.", { ...aiModelParams, temperature: 0.1 });
            for await (const chunk of stream) { if(chunk.text) resultText += chunk.text; }

            const foundFileNames = resultText.split(',').map(f => f.trim());
            const searchResults = files.filter(f => foundFileNames.includes(f.name));
            
            handleWindowInternalStateChange(windowId, { files: searchResults, isSearchingFiles: false });

        } catch (e) {
            console.error("File search failed:", e);
            handleWindowInternalStateChange(windowId, { isSearchingFiles: false });
        }
    };

  const processUserMessage = useCallback(async (userInput: string) => {
    if (isAppInLiveMode) return;
    stopCurrentSpeech();
    setIsQuickPromptsOpen(false);

    let userMessageText = userInput.trim();
    if (!userMessageText && !selectedMediaForInput) { setIsLoading(false); return; }

    const currentSelectedMedia = selectedMediaForInput;
    const lowerUserInput = userMessageText.toLowerCase();

    let imageDataUri: string | undefined;
    if (currentSelectedMedia?.mediaType === 'image') {
        setIsLoading(true);
        try { imageDataUri = await fileToDataUri(currentSelectedMedia.file); } catch (error) {
            console.error("Failed to read image file:", error);
            addMessage("Sorry, I couldn't process the image file.", MessageSender.SYSTEM, 'error');
            setIsLoading(false); return;
        }
        setIsLoading(false);
    }

    let localCommandHandled = false;
    const handleLocalSystemMessage = (text: string) => { addMessage(text, MessageSender.SYSTEM, 'system-info'); localCommandHandled = true; };

    if (lowerUserInput.match(/^(open|activate|enter) boss mode$|^i am boss$|^hide this$/)) { setIsBossModeActive(true); handleLocalSystemMessage("Boss Mode Activated."); } 
    else if (lowerUserInput.match(/^(exit|leave) boss mode$/)) { setIsBossModeActive(false); handleLocalSystemMessage("Boss Mode Deactivated."); } 
    else if (lowerUserInput.match(/^(start|enter|open) live camera( mode)?/i)) { startAppLiveMode('camera'); localCommandHandled = true; } 
    else if (lowerUserInput.match(/^(start|enter|open) live screen( mode)?|share (my )?screen/i)) { startAppLiveMode('screen'); localCommandHandled = true; } 
    else if (lowerUserInput.match(/^(open|show|change) (os )?settings/i)) { setIsAiSettingsModalOpen(true); localCommandHandled = true; } 
    else if (lowerUserInput.match(/^(new chat|start over|reset conversation)/i)) { handleNewChat(); localCommandHandled = true; } 
    else if (lowerUserInput.match(/^(toggle|change) theme|(dark|light) mode/i)) { toggleTheme(); handleLocalSystemMessage(`Theme changed to ${theme === 'dark' ? 'Light' : 'Dark'} Mode.`); } 
    else if (lowerUserInput.match(/^(mute|unmute)( voice| sound| audio)?/i)) { const wasEnabled = isTTSEnabled; setIsTTSEnabled(prev => !prev); handleLocalSystemMessage(`Voice is now ${wasEnabled ? 'muted' : 'unmuted'}.`); } 
    else if (lowerUserInput.match(/^(enter|activate) (study|creative) (mode|workspace)/i)) {
        const match = lowerUserInput.match(/(study|creative)/);
        if (match && match[1]) {
            handleWorkspaceLayout(match[1]);
            localCommandHandled = true;
        }
    }
    else if (lowerUserInput.match(/^(enter|start|begin) focus mode|start a focus session/i)) {
        const durationMatch = lowerUserInput.match(/(\d+)\s*minute/);
        const duration = durationMatch ? parseInt(durationMatch[1], 10) * 60 : 25 * 60;
        const sceneMatch = lowerUserInput.match(/with the '([^']+)' scene/);
        const sceneId = sceneMatch ? sceneMatch[1].replace(/\s+/g, '-').toLowerCase() : 'default';
        
        const command: UICommand = { action: 'CREATE', elementType: 'window', spec: { id: `focus-mode-${uuidv4()}`, title: "Focus Session", windowType: 'focus-mode', timer_duration_seconds: duration, internalState: { sceneId: sceneId } as any } };
        handleUICommands([command]);
        localCommandHandled = true;
    }

    if (localCommandHandled) { setIsLoading(false); return; }
    
    let userMessageAdded = false;
    const addUserMessageToUI = () => {
        if(userMessageAdded) return;
        let attachedFileForMessage: AttachedFileContent | undefined = undefined;
        if (currentSelectedMedia?.mediaType === 'text' && currentSelectedMedia.textContent) { attachedFileForMessage = { fileName: currentSelectedMedia.file.name, fileType: currentSelectedMedia.file.type, textContent: currentSelectedMedia.textContent }; }
        addMessage(userMessageText, MessageSender.USER, undefined, undefined, undefined, imageDataUri, currentSelectedMedia?.mediaType === 'video' ? currentSelectedMedia.previewUrl : undefined, currentSelectedMedia?.mediaType === 'video' ? currentSelectedMedia.file.name : undefined, attachedFileForMessage);
        userMessageAdded = true;
    };
    
    const handleLocalCommand = (responseText: string, source: string = 'memory-action') => { addUserMessageToUI(); const msg = addMessage(responseText, MessageSender.AI, source); triggerSpeechForMessage(msg); setIsLoading(false); };
    const startMultiStepInteraction = (prompt: string) => { addUserMessageToUI(); const msg = addMessage(prompt, MessageSender.AI, 'system-teach-prompt'); triggerSpeechForMessage(msg); setIsLoading(false); }

    if (interactionMode === InteractionMode.AWAITING_TEACH_INPUT) {
        if (pendingQuery === null) { setPendingQuery(userMessageText); startMultiStepInteraction(`Got it. And what should I say when I hear "${userMessageText}"?`);
        } else { setLearnedData(prev => ({ ...prev, commands: { ...(prev.commands || {}), [pendingQuery.toLowerCase()]: userMessageText } })); handleLocalCommand(`Command learned. When you say "${pendingQuery}", I will respond with "${userMessageText}".`); setInteractionMode(InteractionMode.IDLE); setPendingQuery(null); }
        return;
    }
    if (lowerUserInput.match(/^(teach|learn) command$/i)) { setInteractionMode(InteractionMode.AWAITING_TEACH_INPUT); setPendingQuery(null); startMultiStepInteraction("Understood. I'm ready to learn a new command. What is the exact phrase I should listen for?"); return; }

    const nameRegex = /^(my name is|i am|call me)\s+([a-zA-Z0-9\s]+)$/i;
    const nameMatch = userMessageText.match(nameRegex);
    if (nameMatch && nameMatch[2]) { handleLocalCommand(`Noted. I'll call you ${nameMatch[2].trim()}.`, 'personalization'); setLearnedData(prev => ({ ...prev, user_name: nameMatch[2].trim() })); return; }
    if (learnedData.commands && learnedData.commands[lowerUserInput]) { handleLocalCommand(learnedData.commands[lowerUserInput], 'memory-command'); return; }
    
    const teachVisualRegex = /^(?:this is a(?:n)?|it's a(?:n)?|that's a(?:n)?)\s+(.+)$/i;
    const visualLearnMatch = userMessageText.match(teachVisualRegex);
    if (visualLearnMatch && currentSelectedMedia?.mediaType === 'image') {
        if (!imageDataUri) { addMessage("There was an issue processing the image for visual learning. Please try again.", MessageSender.SYSTEM, 'error'); return; }
        addUserMessageToUI();
        const label = visualLearnMatch[1].trim();
        const newItem: LearnedVisualItem = { id: uuidv4(), imageDataUri: imageDataUri, label };
        setVisualLearnedData(prev => [...prev, newItem]);
        const msg = addMessage(`Okay, I've learned that image as "${label}".`, MessageSender.AI, 'visual-memory-action', undefined, undefined, undefined, undefined, undefined, undefined, [newItem]);
        triggerSpeechForMessage(msg);
        setSelectedMediaForInput(null); // Clear after use
        return;
    }

    let promptForAI = userMessageText;
    const agenticPromptRegex = /^(Run|Debug|Explain|Summarize) the (code|text) in component '([^']+)'.(.*)$/i;
    const agenticMatch = userMessageText.match(agenticPromptRegex);
    if (agenticMatch) {
      const action = agenticMatch[1]; const componentType = agenticMatch[2]; const componentId = agenticMatch[3]; const additionalInstructions = agenticMatch[4].trim();
      let componentContent: string | null = null;
      dynamicUI.forEach(win => { const component = win.components.find(c => c.id === componentId); if (component) { componentContent = component.value || null; } });
      if (componentContent !== null) { promptForAI = `${action} the following ${componentType}:\n\`\`\`\n${componentContent}\n\`\`\`\n${additionalInstructions}`.trim(); }
    }

    addUserMessageToUI();
    setIsLoading(true);

    let base64ImageData: { mimeType: string; data: string } | undefined;
    if (currentSelectedMedia?.mediaType === 'image') {
      try { const base64Data = await fileToBase64(currentSelectedMedia.file); base64ImageData = { mimeType: currentSelectedMedia.file.type, data: base64Data };
      } catch (error) { console.error("Error converting image to base64:", error); addMessage("Sorry, I had trouble processing the image.", MessageSender.SYSTEM, 'error'); setIsLoading(false); return; }
    }
    
    let base64VideoData: { mimeType: string; data: string } | undefined;
    if (currentSelectedMedia?.mediaType === 'video') {
       try { const base64Data = await fileToBase64(currentSelectedMedia.file); base64VideoData = { mimeType: currentSelectedMedia.file.type, data: base64Data }; setSelectedMediaForInput(null);
       } catch (error) { console.error("Error converting video to base64:", error); addMessage("Sorry, I had trouble processing the video.", MessageSender.SYSTEM, 'error'); setIsLoading(false); return; }
    }
    
    let attachedTextFile: AttachedFileContent | undefined;
    if (currentSelectedMedia?.mediaType === 'text' && currentSelectedMedia.textContent) { attachedTextFile = { fileName: currentSelectedMedia.file.name, fileType: currentSelectedMedia.file.type, textContent: currentSelectedMedia.textContent }; setSelectedMediaForInput(null); }

    const messageHistory = convertMessagesToGeminiHistory(clearContextForNextQuery ? [] : messagesRef.current);
    if (clearContextForNextQuery) setClearContextForNextQuery(false);

    const useSearchTool = /^(what's|who is|what is|latest|news|weather)/i.test(promptForAI);
    const modelParams: AiModelParams = { ...aiModelParams };
    let jsonParseFailed = false;
    
    const personaInstruction = AI_PERSONAS.find(p => p.id === selectedPersonaId)?.systemInstruction || '';
    const combinedCustomInstruction = `${personaInstruction}\n${customSystemInstruction}`.trim();
    
    const lightweightUIState = createLightweightUIStateForAI(dynamicUI);

    try {
        const stream = await geminiService.generateContentStream( promptForAI, unifiedAiDefinition, messageHistory, base64ImageData, base64VideoData, attachedTextFile, combinedCustomInstruction, modelParams, useSearchTool, lightweightUIState, secureNotes, gamificationState, quests, achievements );
        
        let aiResponseMessage = addMessage("", MessageSender.AI, 'aria-os', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        let fullResponseText = "";

        for await (const chunk of stream) {
          if (chunk.text) {
              fullResponseText += chunk.text;
              setMessages(prev => prev.map(m => m.id === aiResponseMessage.id ? { ...m, text: fullResponseText, isStreaming: true } : m));
          }
        }
        
        const finalResponseText = fullResponseText.trim();
        let finalMessage = { ...aiResponseMessage, text: finalResponseText, isStreaming: false };
        setMessages(prev => prev.map(m => m.id === finalMessage.id ? finalMessage : m));
        
        const jsonMatch = finalResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedCommands = JSON.parse(jsonMatch[1]);
                handleUICommands(Array.isArray(parsedCommands) ? parsedCommands : [parsedCommands]);
            } catch (e) {
                console.error("JSON parsing failed for AI command:", e, "Content:", jsonMatch[1]);
                const errorMsg = `AI sent an invalid command. Please try again. Raw: ${jsonMatch[1]}`;
                addMessage(errorMsg, MessageSender.SYSTEM, 'error');
                jsonParseFailed = true;
            }
        } else if (!jsonParseFailed) {
            triggerSpeechForMessage(finalMessage);
        }

    } catch (e) {
      console.error(e);
      const errorText = e instanceof Error ? e.message : "An unknown error occurred.";
      addMessage(`Sorry, there was an error processing your request. Details: ${errorText}`, MessageSender.SYSTEM, 'error');
    } finally {
      setIsLoading(false);
      // Clear media if it wasn't used for a secure photo creation command
      if (currentSelectedMedia) {
        setSelectedMediaForInput(null);
      }
    }
  }, [geminiService, messages, isAppInLiveMode, customSystemInstruction, aiModelParams, learnedData, interactionMode, pendingQuery, selectedMediaForInput, stopCurrentSpeech, triggerSpeechForMessage, addMessage, dynamicUI, secureNotes, isTTSEnabled, theme, clearContextForNextQuery, handleNewChat, selectedPersonaId, gamificationState, quests, achievements, addXp, updateQuestProgress, checkAndUnlockAchievements, handleWindowInternalStateChange]);

  const handleToggleListening = useCallback(() => {
    if (isLoading) return;
    if (isListening) {
      speechRecognitionRef.current?.stop();
    } else {
      const messageInput = document.getElementById('message-input-field') as HTMLTextAreaElement;
      if (messageInput) messageInput.value = '';
      speechRecognitionRef.current?.start();
    }
  }, [isListening, isLoading]);
  
    const activeWindow = dynamicUI.find(w => w.id === activeWindowId);
    const activeWindowType = activeWindow?.windowType;

    const dockItems = [
        { type: 'dashboard', icon: 'fas fa-th-large', title: 'Dashboard' },
        { type: 'app-launcher', icon: 'fas fa-rocket', title: 'App Launcher' },
        { type: 'activity-log', icon: 'fas fa-bars', title: 'Activity Log' },
        { type: 'code-editor', icon: 'fas fa-code', title: 'Code Editor' },
        { type: 'calculator', icon: 'fas fa-calculator', title: 'Calculator' },
        { type: 'sound-mixer', icon: 'fas fa-sliders-h', title: 'Sound Mixer' },
        { type: 'workflow-automator', icon: 'fas fa-project-diagram', title: 'Workflow Automator' },
        { type: 'file-cabinet', icon: 'fas fa-folder-open', title: 'File Cabinet' },
    ];

  return (
    <>
      {isBossModeActive && <BossModePanel onExit={() => setIsBossModeActive(false)} />}
      {isAppInLiveMode && liveModeSource && (
        <LiveModePanel 
          userMediaStream={userMediaStream}
          aiResponse={liveAiResponse}
          isMicMuted={isLiveMicMuted}
          isCamOrScreenOff={isLiveCamOrScreenOff}
          onToggleMic={() => {
            setIsLiveMicMuted(prev => {
                const newMuteState = !prev;
                if(userMediaStream) userMediaStream.getAudioTracks().forEach(t => t.enabled = !newMuteState);
                if (speechRecognitionRef.current) { newMuteState ? speechRecognitionRef.current.stop() : speechRecognitionRef.current.start(); }
                return newMuteState;
            });
          }}
          onToggleCamOrScreen={() => setIsLiveCamOrScreenOff(prev => {
            const newState = !prev;
            if (userMediaStream) userMediaStream.getVideoTracks().forEach(t => t.enabled = !newState);
            return newState;
          })}
          onEndLiveMode={stopAppLiveMode}
          isLoadingAi={isLoading}
          liveModeSource={liveModeSource}
        />
      )}
      {!isBossModeActive && !isAppInLiveMode && (
         <div className="app-layout">
            <aside className="chat-sidebar">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{display:'flex', alignItems:'center', gap: '0.75rem'}}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#brain_grad)" stroke="#2DD4BF" strokeWidth="1.5"/>
                                <path d="M12 2V22" stroke="url(#brain_line_grad)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"/>
                                <path d="M16 8C16 6.5 15.5 4 12 4C8.5 4 8 6.5 8 8C8 9.5 8.5 10 9 10.5C9.5 11 10 11.5 10.5 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 16C8 17.5 8.5 20 12 20C15.5 20 16 17.5 16 16C16 14.5 15.5 14 15 13.5C14.5 13 14 12.5 13.5 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <defs>
                                    <linearGradient id="brain_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#1F2937"/>
                                        <stop offset="1" stopColor="#111827"/>
                                    </linearGradient>
                                    <linearGradient id="brain_line_grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#2DD4BF" stopOpacity="0"/>
                                        <stop offset="0.5" stopColor="#2DD4BF"/>
                                        <stop offset="1" stopColor="#2DD4BF" stopOpacity="0"/>
                                    </linearGradient>
                                </defs>
                            </svg>

                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                              A.R.I.A. OS
                            </h1>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap: '0.25rem'}}>
                            <button onClick={handleNewChat} className="icon-button" title="New Chat"><i className="fas fa-plus"></i></button>
                            <button onClick={() => setIsAiSettingsModalOpen(true)} className="icon-button" title="AI Settings"><i className="fas fa-cog"></i></button>
                        </div>
                    </div>
                </div>
                {isQuickPromptsOpen && 
                    <QuickPromptsPanel 
                        isOpen={isQuickPromptsOpen}
                        onClose={() => setIsQuickPromptsOpen(false)}
                        onPromptSelected={processUserMessage}
                        hasSelectedImage={selectedMediaForInput?.mediaType === 'image'}
                        hasSelectedVideo={selectedMediaForInput?.mediaType === 'video'}
                        hasSelectedTextFile={selectedMediaForInput?.mediaType === 'text'}
                        activeWindowType={activeWindowType}
                    />
                }
                <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={(msg) => processUserMessage(msg)}
                    interactionMode={interactionMode}
                    selectedMedia={selectedMediaForInput}
                    onSetSelectedMedia={setSelectedMediaForInput}
                    isListening={isListening}
                    isSpeechRecognitionAvailable={isSpeechRecognitionAvailable}
                    onToggleListening={handleToggleListening}
                    onToggleQuickPrompts={() => setIsQuickPromptsOpen(prev => !prev)}
                    onStartLiveMode={startAppLiveMode}
                    isAwaitingTeachInput={interactionMode === InteractionMode.AWAITING_TEACH_INPUT}
                />
            </aside>

            <main className="desktop-area">
                <div className="desktop-orb"></div>
                <DynamicUIManager 
                    windows={dynamicUI}
                    messages={messages}
                    secureNotes={secureNotes}
                    learnedData={learnedData}
                    gamificationState={gamificationState}
                    quests={quests}
                    achievements={achievements}
                    onComponentAction={handleComponentAction}
                    onWindowAction={(cmd) => handleUICommands([cmd])}
                    onBringToFront={bringWindowToFront}
                    onUpdateWindowRect={updateWindowRect}
                    userMediaStream={userMediaStream}
                    onComponentValueChange={handleComponentValueChange}
                    onWindowInternalStateChange={handleWindowInternalStateChange}
                    onProcessUserMessage={processUserMessage}
                    onSaveSecurePhoto={handleSaveSecurePhoto}
                />
            </main>
            
            <div className="app-dock">
                {dockItems.map(item => (
                    <button 
                        key={item.type}
                        onClick={() => processUserMessage(`open ${item.title}`)}
                        className="icon-button"
                        title={item.title}
                        style={{width: 44, height: 44, fontSize: '20px', backgroundColor: 'transparent'}}
                    >
                        <i className={item.icon}></i>
                    </button>
                ))}
            </div>

            <VisualMemoryModal
              isOpen={isVisualMemoryModalOpen}
              onClose={handleCloseVisualMemoryModal}
              visualItems={visualLearnedData}
              onDeleteItem={handleDeleteVisualItem}
              onUpdateLabel={handleUpdateVisualItemLabel}
            />

            <AiSettingsModal
                isOpen={isAiSettingsModalOpen}
                onClose={() => setIsAiSettingsModalOpen(false)}
                currentParams={aiModelParams}
                currentCustomInstruction={customSystemInstruction}
                onSave={(newParams, newInstruction, newPersonaId, newVoiceURI) => {
                    setAiModelParams(newParams);
                    setCustomInstruction(newInstruction);
                    setSelectedPersonaId(newPersonaId);
                    setSelectedVoiceURI(newVoiceURI);
                    setIsAiSettingsModalOpen(false);
                    addMessage("AI settings have been updated for this session.", MessageSender.SYSTEM, 'system-info');
                }}
                personas={AI_PERSONAS}
                selectedPersonaId={selectedPersonaId}
                availableVoices={availableVoices}
                selectedVoiceURI={selectedVoiceURI}
            />
        </div>
      )}
    </>
  );
};

export default App;