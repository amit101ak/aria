


export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface ChatMessageOption {
  text: string;
  type: string;
}
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface LearnedVisualItem {
  id: string;
  imageDataUri: string;
  label: string;
}

export interface SuggestedChessMove {
  from: string;
  to: string;
}

export interface AttachedFileContent {
  fileName: string;
  fileType: string; // MIME type
  textContent: string;
}

export interface ChatMessage {
  id:string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  source?: string;
  options?: ChatMessageOption[];
  groundingChunks?: GroundingChunk[];
  imagePreviewUrl?: string; 
  videoPreviewUrl?: string; 
  videoFileName?: string;   
  learnedVisuals?: LearnedVisualItem[];
  imageForAISuggestionPreviewUrl?: string;
  suggestedChessMove?: SuggestedChessMove;
  isSpeaking?: boolean;
  isStreaming?: boolean;
  attachedFile?: AttachedFileContent; 
  isError?: boolean;
}

export enum InteractionMode {
  IDLE = 'idle',
  AWAITING_USER_CHOICE = 'awaiting_user_choice',
  AWAITING_TEACH_INPUT = 'awaiting_teach_input',
  AWAITING_EMAIL_COMPOSITION = 'awaiting_email_composition',
  AWAITING_WHATSAPP_COMPOSITION = 'awaiting_whatsapp_composition',
}

export interface LearnedData {
  user_name?: string;
  commands?: Record<string, string>;
  reminders_list?: string[];
  [key: string]: any; // For dynamic lists like list_shopping, etc.
}

export enum AiMode {
  UNIFIED_ADVANCED_AI = 'UnifiedAdvancedAI',
}

export interface UnifiedAiDefinition {
  id: AiMode;
  name: string;
  icon: string;
  description: string;
  systemInstruction: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Content {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface AiModelParams {
  temperature: number;
  topK: number;
  topP: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export type MediaType = 'image' | 'video' | 'text';

export interface SelectedMediaFile {
  file: File;
  previewUrl: string; // blob URL for image/video, or data URI for icons for text files
  mediaType: MediaType;
  textContent?: string; // For text-based files, after reading
}

//--- NEW FEATURE TYPES ---//

export interface AiPersona {
    id: string;
    name: string;
    description: string;
    systemInstruction: string;
}

export interface WorkspaceLayout {
    id: string;
    name: string;
    commands: UICommand[];
}

export interface FocusScene {
    id: string;
    name: string;
    backgroundUrl: string;
    sound: { type: string; src: string; };
}

export interface ManagedFile {
    id: string;
    name: string;
    type: string; // MIME type
    size: number;
    content: string; // data URI for images, text content for text files
    aiTags?: string[];
    aiDescription?: string;
}

export interface Workflow {
    id: string;
    name: string;
    steps: string[]; // For simplicity, steps are just text commands
}

//--- Gamification Types ---//
export interface GamificationState {
    level: number;
    xp: number;
    xpToNextLevel: number;
    streak: number;
    lastActivityDate: string | null; // ISO date string
    unopenedLootChests: number;
    // statistics for achievements
    notesCreated: number;
    focusSessionsCompleted: number;
    linesOfCodeWritten: number;
    questsCompleted: number;
}

export type QuestType = 'daily' | 'weekly';
export type QuestMetric = 'write_words' | 'focus_sessions' | 'quests_completed' | 'lines_coded';

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    metric: QuestMetric;
    progress: number;
    goal: number;
    xpReward: number;
    completed: boolean;
    rewardLootChests: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    icon: string; // font-awesome icon class
    color: string; // hex color for icon bg
}

export type RewardType = 'theme' | 'wallpaper' | 'soundpack' | 'cosmetic';

export interface Reward {
    type: RewardType;
    name: string;
    description: string;
}


//--- Gemini OS Dynamic UI Types ---//

export type SecureItemType = 'note' | 'photo';

export interface SecureNote {
  id: string;
  name: string;
  isLocked: boolean;
  password: string | null;
  type: SecureItemType;
  encryptedContent?: string; // for 'note'
  encryptedImageDataUri?: string; // for 'photo'
}

export interface UIRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type UIComponentType = 'label' | 'button' | 'input' | 'textarea' | 'image' | 'iframe' | 'live-view';

export interface UIComponent {
    id: string;
    type: UIComponentType;
    rect: UIRect;
    text?: string;       // for label, button
    placeholder?: string;// for input, textarea
    src?: string;        // for image, iframe
    source?: 'camera' | 'screen'; // for live-view
    prompt?: string;     // for button action
    value?: string;      // for input, textarea value, and button value
    style?: Record<string, string | number>;
    action?: string; // For client-side actions like 'timer:start', 'calculator:digit'
    role?: string;   // To identify special components like 'timer-display', 'calculator-display'
}

export type WindowType = 'timer' | 'calculator' | 'code-editor' | 'tic-tac-toe' | 'activity-log' | 'browser' | 'focus-mode' | 'sound-mixer' | 'encrypted-note' | 'image-generator' | 'translator' | 'whiteboard' | 'file-cabinet' | 'workflow-automator' | 'game-hub' | 'dashboard' | 'app-launcher' | 'secure-photo-creator';

export interface UIWindow {
    id: string;
    rect: UIRect;
    title: string;
    components: UIComponent[];
    zIndex?: number;
    isHidden?: boolean;
    windowType?: WindowType;
    timer_duration_seconds?: number;
    noteId?: string; // For encrypted-note, links to the SecureNote object
    noteName?: string; // For encrypted-note, for display and AI identification
    internalState?: {
        // Timer state
        timeRemaining?: number;
        timerRunning?: boolean;
        sceneId?: string;
        // Calculator state
        displayValue?: string;
        previousValue?: number | null;
        operator?: string | null;
        waitingForOperand?: boolean;
        // Tic Tac Toe State
        board?: (string | null)[];
        playerMark?: 'X' | 'O';
        aiMark?: 'X' | 'O';
        currentPlayer?: 'X' | 'O';
        isGameOver?: boolean;
        winner?: string | null;
        // Sound Mixer State
        sounds?: { [key: string]: { playing: boolean; volume: number; } };
        // Encrypted Note UI State (transient) / Secure Photo Creator state
        passwordAttempt?: string;
        error?: string;
        // Image Generator State
        prompt?: string;
        generatedImage?: string | null; // data URI
        isGeneratingImage?: boolean;
        imageGenError?: string | null;
        // Browser State
        browserUrl?: string;
        // --- NEW WINDOW STATES --- //
        // Translator State
        fromLang?: string;
        toLang?: string;
        inputText?: string;
        translatedText?: string;
        isTranslating?: boolean;
        // Whiteboard State
        svgContent?: string;
        isGeneratingSvg?: boolean;
        // File Cabinet State
        files?: ManagedFile[];
        searchTerm?: string;
        isSearchingFiles?: boolean;
        // Workflow Automator
        workflowContent?: string;
        // --- GAMIFICATION --- //
        activeTab?: 'dashboard' | 'quests' | 'achievements' | 'loot';
        // --- SECURE PHOTO CREATOR --- //
        status?: 'awaiting_image' | 'awaiting_password' | 'saving';
        imagePreviewUrl?: string | null;
        imageData?: string | null;
        noteName?: string;
    };
}

export type UIAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'COPY' | 'PASTE';
export type UIElementType = 'window' | 'component';

export interface UICommand {
    action: UIAction;
    elementType: UIElementType;
    targetId?: string;
    spec?: Partial<UIWindow | UIComponent> & { noteName?: string, itemType?: SecureItemType };
    // For agentic actions
    sourceComponentId?: string; // for COPY
    destinationComponentId?: string; // for PASTE
}

//--- Live Mode Types ---//
export interface LiveAiResponse {
  userTranscript?: string;
  text: string;
  isSpeaking?: boolean;
  timestamp: Date;
}

export type LiveModeSourceType = 'camera' | 'screen';