import React, { useState, useRef, useEffect } from 'react';
import { SelectedMediaFile, LiveModeSourceType } from '../types';

interface MessageInputProps {
  onSendMessage: (message: string, isVoiceInput?: boolean) => void;
  isLoading: boolean;
  isAwaitingTeachInput: boolean;
  selectedMedia: SelectedMediaFile | null;
  onSetSelectedMedia: (media: SelectedMediaFile | null) => void;
  isListening: boolean;
  isSpeechRecognitionAvailable: boolean;
  onToggleListening: () => void;
  onToggleQuickPrompts: () => void;
  onStartLiveMode: (source: LiveModeSourceType) => void;
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  isAwaitingTeachInput,
  selectedMedia,
  onSetSelectedMedia,
  isListening,
  isSpeechRecognitionAvailable,
  onToggleListening,
  onToggleQuickPrompts,
  onStartLiveMode,
}) => {
  const [inputValue, setInputValue] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleClearSelectedMedia = () => {
    if (selectedMedia?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedMedia.previewUrl);
    }
    onSetSelectedMedia(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) { alert('Invalid image file type (JPEG, PNG, WebP only).'); event.target.value = ''; return; }
      if (file.size > MAX_IMAGE_FILE_SIZE) { alert(`Image file too large (Max ${MAX_IMAGE_FILE_SIZE / (1024 * 1024)}MB).`); event.target.value = ''; return; }
      handleClearSelectedMedia();
      onSetSelectedMedia({ file, previewUrl: URL.createObjectURL(file), mediaType: 'image' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || selectedMedia) && !isLoading && !isListening) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const placeholderText = isAwaitingTeachInput
    ? `Awaiting your instructions...`
    : isListening ? "Listening... Speak now." : "Enter a command...";
  const canSubmit = !isLoading && (!!inputValue.trim() || !!selectedMedia) && !isListening;
  const generalDisabled = isLoading || isListening;

  const inputActions = [
    { icon: 'fa-desktop', title: 'Start Screen Share', action: () => onStartLiveMode('screen'), disabled: generalDisabled },
    { icon: 'fa-video', title: 'Start Camera', action: () => onStartLiveMode('camera'), disabled: generalDisabled },
    { icon: 'fa-image', title: 'Attach Image', action: () => imageInputRef.current?.click(), disabled: generalDisabled || !!selectedMedia },
    { icon: 'fa-bolt', title: 'Quick Prompts', action: onToggleQuickPrompts, disabled: generalDisabled },
    { icon: 'fa-microphone', title: 'Voice Input', action: onToggleListening, disabled: isLoading, isListening: isListening }
  ];

  return (
    <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {inputActions.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.action}
            className={`icon-button ${item.isListening ? 'active' : ''}`}
            aria-label={item.title}
            title={item.title}
            disabled={item.disabled}
            style={{ color: item.isListening ? 'var(--primary-color)' : undefined }}
          >
            <i className={`fas ${item.icon}`}></i>
          </button>
        ))}
        <input type="file" ref={imageInputRef} accept={ALLOWED_IMAGE_MIME_TYPES.join(',')} onChange={handleImageChange} style={{ display: 'none' }} id="imageUpload" />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{position: 'relative', flexGrow: 1}}>
            <textarea
              id="message-input-field"
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={placeholderText}
              rows={1}
              className="focus-ring custom-scrollbar"
              style={{
                  width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem',
                  border: '1px solid var(--input-border)', borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem', backgroundColor: 'var(--input-bg)',
                  color: 'var(--input-text)', resize: 'none',
                  minHeight: '50px', maxHeight: '150px', lineHeight: 1.5,
                  fontFamily: 'inherit'
              }}
              disabled={generalDisabled && !isListening}
              aria-label="Message input"
            />
             {selectedMedia && (
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 1}}>
                    <img src={selectedMedia.previewUrl} alt="Preview" style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)'}}/>
                    <button type="button" onClick={handleClearSelectedMedia} style={{position: 'absolute', top: '-8px', right: '-8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '20px', height: '20px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer', fontSize:'12px'}}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
             )}
        </div>
        <button
          type="submit"
          disabled={!canSubmit || generalDisabled}
          style={{
              width: '50px', height: '50px',
              backgroundColor: canSubmit ? '#0E7490' : 'var(--bg-tertiary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 0.2s ease',
          }}
          aria-label="Send message">
            {(isLoading && !isListening) ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-paper-plane text-lg"></i>}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;