
import React from 'react';
import { WindowType } from '../types';

interface QuickPromptsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptSelected: (prompt: string) => void;
  hasSelectedImage: boolean;
  hasSelectedVideo: boolean;
  hasSelectedTextFile: boolean;
  activeWindowType?: WindowType | null;
}

const QuickPromptsPanel: React.FC<QuickPromptsPanelProps> = ({
  isOpen,
  onClose,
  onPromptSelected,
  hasSelectedImage,
  hasSelectedVideo,
  hasSelectedTextFile,
  activeWindowType,
}) => {
  if (!isOpen) return null;

  const generalPrompts = [
    { text: "What are your main capabilities?", icon: "fa-star" },
    { text: "Tell me a fun fact about space.", icon: "fa-rocket" },
    { text: "Suggest a creative story idea.", icon: "fa-lightbulb" },
    { text: "Open a calculator and a note.", icon: "fa-window-restore" },
    { text: "Enter study mode.", icon: "fa-book" },
    { text: "Start a 25 minute focus timer.", icon: "fa-clock" },
  ];

  const imagePrompts = [
    { text: "Describe this image in detail.", icon: "fa-image" },
    { text: "What is the main subject of this image?", icon: "fa-image" },
    { text: "Create a secure photo named 'My Upload'", icon: "fa-lock" },
    { text: "Is there a cat in this image?", icon: "fa-image" },
  ];

  const videoPrompts = [
    { text: "Summarize this video.", icon: "fa-film" },
    { text: "What is happening in this video clip?", icon: "fa-film" },
    { text: "Analyze this athletic performance.", icon: "fa-film" },
    { text: "Provide coaching feedback for this video.", icon: "fa-film" },
  ];
  
  const textFilePrompts = [
    { text: "Summarize this document.", icon: "fa-file-alt" },
    { text: "What are the key points of this text?", icon: "fa-file-alt" },
    { text: "Extract action items from this document.", icon: "fa-file-alt" },
    { text: "What is the sentiment of this text?", icon: "fa-file-alt" },
  ];

  const contextPrompts: { [key in WindowType]?: { text: string; icon: string }[] } = {
    'code-editor': [
        { text: "Explain this code.", icon: "fa-comment-alt" },
        { text: "Debug this code for errors.", icon: "fa-bug" },
        { text: "Suggest optimizations for this code.", icon: "fa-rocket" },
        { text: "Add comments to this code.", icon: "fa-pen" },
    ],
    'whiteboard': [
        { text: "Draw a mind map about renewable energy.", icon: "fa-brain" },
        { text: "Draw a user flow for a login page.", icon: "fa-sitemap" },
        { text: "Draw a simple house.", icon: "fa-home" },
    ],
    'translator': [
        { text: "Translate 'How are you?' from English to French.", icon: "fa-language" },
        { text: "Translate my last message to German.", icon: "fa-language" },
    ],
    'file-cabinet': [
        { text: "Search for files related to 'marketing'.", icon: "fa-search" },
        { text: "Find all image files.", icon: "fa-file-image" },
    ],
  };

  let promptsToShow;

  if (activeWindowType && contextPrompts[activeWindowType]) {
    promptsToShow = contextPrompts[activeWindowType];
  } else if (hasSelectedImage) {
    promptsToShow = imagePrompts;
  } else if (hasSelectedVideo) {
    promptsToShow = videoPrompts;
  } else if (hasSelectedTextFile) {
    promptsToShow = textFilePrompts;
  } else {
    promptsToShow = generalPrompts;
  }
  
  return (
    <div
      className="animate-fadeIn"
      style={{
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)',
        position: 'relative', 
        zIndex: 15, 
      }}
      role="region"
      aria-labelledby="quick-prompts-title"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 id="quick-prompts-title" style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-bolt mr-2" style={{color: 'var(--primary-color)'}}></i>Quick Prompts
        </h3>
        <button
            onClick={onClose}
            className="icon-button"
            title="Close Quick Prompts"
            aria-label="Close Quick Prompts"
        >
            <i className="fas fa-times"></i>
        </button>
      </div>
      <div 
        className="custom-scrollbar"
        style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '0.75rem',
            maxHeight: '200px', 
            overflowY: 'auto',
            paddingRight: '0.5rem' 
        }}
      >
        {promptsToShow.map((promptItem, index) => (
          <button
            key={index}
            onClick={() => onPromptSelected(promptItem.text)}
            style={{
              padding: '0.6rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: 'var(--shadow)',
              transition: 'background-color 0.2s, border-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            className="focus-ring"
          >
           <i className={`fas ${promptItem.icon}`} style={{color:'var(--primary-color)', fontSize:'0.8em', opacity:0.8, width:'1em', textAlign:'center'}}></i>
           <span>{promptItem.text}</span>
          </button>
        ))}
      </div>
      {promptsToShow.length === 0 && ( 
         <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign:'center', padding: '1rem 0'}}>No specific quick prompts available for the current context.</p>
      )}
    </div>
  );
};

export default QuickPromptsPanel;
