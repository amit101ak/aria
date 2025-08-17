
import React, { useState, useEffect } from 'react';
import { LearnedVisualItem } from '../types';

interface VisualMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualItems: LearnedVisualItem[];
  onDeleteItem: (itemId: string) => void;
  onUpdateLabel: (itemId: string, newLabel: string) => void;
}

const VisualMemoryModal: React.FC<VisualMemoryModalProps> = ({
  isOpen,
  onClose,
  visualItems,
  onDeleteItem,
  onUpdateLabel,
}) => {
  const [editableItems, setEditableItems] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initialEditableItems: Record<string, string> = {};
      visualItems.forEach(item => {
        initialEditableItems[item.id] = item.label;
      });
      setEditableItems(initialEditableItems);
    }
  }, [isOpen, visualItems]);

  if (!isOpen) return null;

  const handleLabelChange = (itemId: string, newLabel: string) => {
    setEditableItems(prev => ({ ...prev, [itemId]: newLabel }));
  };

  const handleSaveLabel = (itemId: string) => {
    const newLabel = editableItems[itemId];
    const currentItem = visualItems.find(item => item.id === itemId);
    if (newLabel && newLabel.trim() !== currentItem?.label) {
      onUpdateLabel(itemId, newLabel.trim());
    } else if (!newLabel || newLabel.trim() === "") {
      alert("Label cannot be empty.");
      if(currentItem) setEditableItems(prev => ({ ...prev, [itemId]: currentItem.label }));
    }
  };

  const handleDelete = (itemId: string) => {
    onDeleteItem(itemId);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fadeIn" 
      style={{backgroundColor: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)'}}
      aria-modal="true" 
      role="dialog" 
      aria-labelledby="visual-memory-modal-title"
    >
      <div style={{
          backgroundColor: 'var(--modal-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '768px', /* md:max-w-4xl */
          border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h3 id="visual-memory-modal-title" style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center'}}>
            <i className="fas fa-images mr-3 text-2xl" style={{color: 'var(--primary-color)'}}></i>Your Visual Memory
          </h3>
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close visual memory modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {visualItems.length === 0 ? (
          <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0'}}>
              You haven't taught me any images yet.
              <br />
              Upload an image and say "This is a [label]" to get started!
            </p>
          </div>
        ) : (
          <div className="custom-scrollbar" style={{flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem', marginRight: '-0.5rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem'}}>
              {visualItems.map((item) => (
                <div key={item.id} style={{
                    backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', 
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', 
                    border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'
                }}>
                  <img 
                    src={item.imageDataUri} 
                    alt={item.label} 
                    style={{
                        width: '100%', height: '160px', objectFit: 'contain', 
                        borderRadius: 'var(--radius)', marginBottom: '0.75rem', 
                        backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)'
                    }} 
                  />
                  <input
                    type="text"
                    value={editableItems[item.id] || ''}
                    onChange={(e) => handleLabelChange(item.id, e.target.value)}
                    style={{
                        width: '100%', padding: '0.5rem', backgroundColor: 'var(--input-bg)', 
                        border: '1px solid var(--input-border)', borderRadius: 'var(--radius)', 
                        color: 'var(--input-text)', fontSize: '0.875rem', marginBottom: '0.5rem'
                    }}
                    className="focus-ring"
                    aria-label={`Label for image ${item.id}`}
                  />
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: 'auto'}}>
                    <button
                      onClick={() => handleSaveLabel(item.id)}
                      disabled={!editableItems[item.id]?.trim() || editableItems[item.id]?.trim() === item.label}
                      style={{
                        flex: 1, padding: '0.375rem 0.75rem', backgroundColor: 'var(--primary-color)', 
                        color: 'white', fontSize: '0.75rem', fontWeight: '500', 
                        borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                        opacity: (!editableItems[item.id]?.trim() || editableItems[item.id]?.trim() === item.label) ? 0.6 : 1,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem'
                      }}
                      className="hover:bg-primary-dark-color focus-ring"
                    >
                      <i className="fas fa-save"></i>Save
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                       style={{
                        flex: 1, padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', 
                        color: 'white', fontSize: '0.75rem', fontWeight: '500', 
                        borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem'
                      }}
                      className="hover:opacity-90 focus-ring"
                    >
                      <i className="fas fa-trash-alt"></i>Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end'}}>
          <button
            onClick={onClose}
            style={{
                padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-tertiary)', 
                color: 'var(--text-primary)', fontWeight: '500', 
                borderRadius: 'var(--radius)', border:'1px solid var(--border-color)', cursor: 'pointer', boxShadow:'var(--shadow)'
            }}
            className="hover:bg-border-color focus-ring"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualMemoryModal;
