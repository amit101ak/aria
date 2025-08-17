import React from 'react';
import { ChatMessage, LearnedVisualItem, MessageSender }
from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const formatTextWithLinksAndMarkdown = (text: string) => {
    let html = text;
    // Basic protection against HTML injection
    html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Markdown-like formatting
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong style="font-weight: 600;">$1$2</strong>');
    html = html.replace(/\*(.*?)\*|_([^_]+)_/g, '<em>$1$2</em>');
    html = html.replace(/`([^`]+)`/g, '<code style="background-color: var(--bg-primary); padding: 0.1em 0.3em; border-radius: var(--radius); font-size: 0.9em; color: var(--primary-color); border: 1px solid var(--border-color);">$1</code>');
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    html = html.replace(linkRegex, `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: underline;">$1</a>`);
    html = html.replace(/\n/g, '<br />');
    return html;
  };

  const formattedText = formatTextWithLinksAndMarkdown(message.text);

  if (isSystem) {
    return (
      <div className="animate-subtlePopIn" style={{
        margin: '0.25rem auto',
        fontSize: '0.8rem',
        color: 'var(--system-message-text)',
        textAlign: 'center',
        maxWidth: '80%',
      }}>
        <span dangerouslySetInnerHTML={{ __html: formattedText }}></span>
      </div>
    );
  }

  const avatar = (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      backgroundColor: 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: 'var(--primary-color)'
    }}>
      <i className="fas fa-robot"></i>
    </div>
  );

  const bubbleStyle: React.CSSProperties = {
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-lg)',
      lineHeight: 1.5,
      wordWrap: 'break-word',
      backgroundColor: isUser ? 'var(--user-bubble-bg)' : 'var(--ai-bubble-bg)',
      color: isUser ? 'var(--user-bubble-text)' : 'var(--ai-bubble-text)',
      minWidth: message.isStreaming && message.text.trim() === "" ? '60px' : 'auto',
  };
  
  const mainContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    maxWidth: '90%',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    flexDirection: isUser ? 'row-reverse' : 'row',
  };

  return (
    <div className="message-container animate-subtlePopIn" style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={mainContainerStyle}>
          {!isUser && avatar}
          <div className="bubble" style={bubbleStyle}>
            {isUser && message.imagePreviewUrl && (
              <img src={message.imagePreviewUrl} alt="User content" style={{ maxWidth: '200px', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }} />
            )}
            
            {message.isStreaming && message.text.trim() === "" && (
               <div className="typing-dots"><span></span><span></span><span></span></div>
            )}

            <div dangerouslySetInnerHTML={{ __html: formattedText || "&nbsp;" }} />
          </div>
        </div>
        <div style={{
            marginTop: '0.375rem',
            padding: `0 ${isUser ? '0' : '2.75rem'}`,
            fontSize: '0.75rem', 
            color: 'var(--text-tertiary)'
        }}>
            <i className="far fa-clock" style={{opacity:0.7, marginRight: '0.375rem'}}></i>
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    </div>
  );
};

export default MessageBubble;