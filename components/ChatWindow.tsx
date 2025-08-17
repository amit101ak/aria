import React, { useEffect, useRef } from 'react';
import { ChatMessage, InteractionMode, SelectedMediaFile, LiveModeSourceType, MessageSender } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, isVoiceInput?: boolean) => void;
  interactionMode: InteractionMode;
  selectedMedia: SelectedMediaFile | null;
  onSetSelectedMedia: (media: SelectedMediaFile | null) => void;
  isListening: boolean;
  isSpeechRecognitionAvailable: boolean;
  onToggleListening: () => void;
  onToggleQuickPrompts: () => void;
  onStartLiveMode: (source: LiveModeSourceType) => void;
  isAwaitingTeachInput: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSendMessage,
  interactionMode,
  selectedMedia,
  onSetSelectedMedia,
  isListening,
  isSpeechRecognitionAvailable,
  onToggleListening,
  onToggleQuickPrompts,
  onStartLiveMode,
  isAwaitingTeachInput,
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem', 
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem' 
        }}
      >
        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <MessageBubble message={msg} />
          </React.Fragment>
        ))}
        {isLoading && messages[messages.length - 1]?.sender !== MessageSender.AI && (
           <MessageBubble message={{ id: 'loading', text: '', sender: MessageSender.AI, timestamp: new Date(), isStreaming: true }} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        isAwaitingTeachInput={isAwaitingTeachInput}
        selectedMedia={selectedMedia}
        onSetSelectedMedia={onSetSelectedMedia}
        isListening={isListening}
        isSpeechRecognitionAvailable={isSpeechRecognitionAvailable}
        onToggleListening={onToggleListening}
        onToggleQuickPrompts={onToggleQuickPrompts}
        onStartLiveMode={onStartLiveMode}
      />
    </div>
  );
};

export default ChatWindow;