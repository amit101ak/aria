

import React, { useState, useEffect, useCallback } from 'react';
import { AiModelParams, AiPersona } from '../types';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: AiModelParams;
  currentCustomInstruction: string;
  onSave: (newParams: AiModelParams, newCustomInstruction: string, newPersonaId: string, newVoiceURI: string | null) => void;
  personas: AiPersona[];
  selectedPersonaId: string;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
}

const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  currentParams,
  currentCustomInstruction,
  onSave,
  personas,
  selectedPersonaId,
  availableVoices,
  selectedVoiceURI,
}) => {
  const [params, setParams] = useState<AiModelParams>(currentParams);
  const [customInstruction, setCustomInstruction] = useState(currentCustomInstruction);
  const [personaId, setPersonaId] = useState(selectedPersonaId);
  const [voiceURI, setVoiceURI] = useState(selectedVoiceURI);


  useEffect(() => {
    setParams(currentParams);
    setCustomInstruction(currentCustomInstruction);
    setPersonaId(selectedPersonaId);
    setVoiceURI(selectedVoiceURI);
  }, [isOpen, currentParams, currentCustomInstruction, selectedPersonaId, selectedVoiceURI]);

  const handleParamChange = (paramName: keyof AiModelParams, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setParams(prev => ({ ...prev, [paramName]: numValue }));
    } else if (value === "") { 
       setParams(prev => ({ ...prev, [paramName]: paramName === 'topK' ? 1 : 0 }));
    }
  };
  
  const handleTopKChange = (value: string) => {
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue)) {
        setParams(prev => ({...prev, topK: Math.max(1, intValue)}));
    } else if (value === "") {
        setParams(prev => ({...prev, topK: 1}));
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalParams: AiModelParams = {
        temperature: Math.max(0, Math.min(2, params.temperature)),
        topP: Math.max(0, Math.min(1, params.topP)),
        topK: Math.max(1, Math.round(params.topK)),
    };
    onSave(finalParams, customInstruction.trim(), personaId, voiceURI);
  };

  if (!isOpen) return null;

  const SliderInput: React.FC<{label: string, id: keyof AiModelParams, value: number, min: number, max: number, step: number, helpText: string, unit?: string}> = 
    ({label, id, value, min, max, step, helpText, unit}) => (
    <div style={{marginBottom: '1.25rem'}}>
      <label htmlFor={id} style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
        {label} <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>({value.toFixed(id === 'topK' ? 0:2)}{unit})</span>
      </label>
      <input
        type="range"
        id={id}
        name={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleParamChange(id, e.target.value)}
        style={{
            width: '100%', height: '0.5rem', backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-lg)', appearance: 'none', cursor: 'pointer'
            // Accent color needs to be handled by browser or custom CSS for thumb if needed
        }}
        className="focus-ring slider-thumb" // slider-thumb would need custom CSS for the thumb itself
      />
      <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>{helpText}</p>
    </div>
  );


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      style={{backgroundColor: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)'}}
      aria-modal="true"
      role="dialog"
      aria-labelledby="ai-settings-modal-title"
    >
      <form onSubmit={handleSubmit} style={{
          backgroundColor: 'var(--modal-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '500px', 
          border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh'
        }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem'}}>
          <h3 id="ai-settings-modal-title" style={{fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center'}}>
            <i className="fas fa-sliders-h mr-3 text-2xl" style={{color: 'var(--primary-color)'}}></i>AI Behavior Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Close AI settings"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="custom-scrollbar" style={{flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem', marginRight: '-0.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
          <div>
            <label htmlFor="persona" style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                AI Persona
            </label>
             <select
                id="persona"
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                 style={{
                  width: '100%', padding: '0.65rem', backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)', borderRadius: 'var(--radius)',
                  color: 'var(--input-text)', fontSize: '0.875rem', boxShadow: 'var(--shadow)',
                  fontFamily: 'inherit',
                }}
                className="focus-ring"
            >
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
             <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>{personas.find(p => p.id === personaId)?.description}</p>
          </div>
           <div>
            <label htmlFor="voice" style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                Spoken Voice
            </label>
             <select
                id="voice"
                value={voiceURI || ''}
                onChange={(e) => setVoiceURI(e.target.value)}
                 style={{
                  width: '100%', padding: '0.65rem', backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)', borderRadius: 'var(--radius)',
                  color: 'var(--input-text)', fontSize: '0.875rem', boxShadow: 'var(--shadow)',
                  fontFamily: 'inherit',
                }}
                className="focus-ring"
                disabled={availableVoices.length === 0}
            >
                <option value="">System Default</option>
                {availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
             <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>
                {availableVoices.length > 0 ? 'Select an installed system voice.' : 'No custom voices available.'}
             </p>
          </div>
          <div>
            <label htmlFor="customInstruction" style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
              Temporary Session Focus
            </label>
            <textarea
              id="customInstruction"
              rows={3}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              style={{
                  width: '100%', padding: '0.65rem', backgroundColor: 'var(--input-bg)', 
                  border: '1px solid var(--input-border)', borderRadius: 'var(--radius)', 
                  color: 'var(--input-text)', fontSize: '0.875rem', boxShadow: 'var(--shadow)',
                  fontFamily:'inherit', resize:'vertical'
              }}
              className="focus-ring"
              placeholder="e.g., Act as a Shakespearean poet for this session."
            />
            <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>Added to AI's main prompt for this session only. Not saved permanently.</p>
          </div>

          <div style={{paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)'}}>
             <h4 style={{fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem'}}>Model Parameters</h4>
            <SliderInput 
                label="Temperature" id="temperature" value={params.temperature} min={0} max={2} step={0.05}
                helpText="Controls randomness. Lower (e.g., 0.2) is more deterministic, higher (e.g., 1.0-2.0) is more creative."
            />
            <SliderInput
                label="Top-P" id="topP" value={params.topP} min={0} max={1} step={0.01}
                helpText="Nucleus sampling. Considers tokens with probability mass summing to this value (e.g., 0.95)."
            />
             <div style={{marginBottom: '1rem'}}>
                <label htmlFor="topK" style={{display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                    Top-K <span style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>({params.topK})</span>
                </label>
                <input
                    type="number"
                    id="topK"
                    name="topK"
                    min="1"
                    max="1000"
                    step="1"
                    value={params.topK.toString()}
                    onChange={(e) => handleTopKChange(e.target.value)}
                    style={{
                        width: '100%', padding: '0.65rem', backgroundColor: 'var(--input-bg)', 
                        border: '1px solid var(--input-border)', borderRadius: 'var(--radius)', 
                        color: 'var(--input-text)', fontSize: '0.875rem', boxShadow: 'var(--shadow)',
                        fontFamily:'inherit'
                    }}
                    className="focus-ring"
                />
                 <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>Considers the top K most probable tokens (e.g., 40). Must be an integer ≥ 1.</p>
            </div>
          </div>
        </div>

        <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          <button
            type="submit"
            style={{
                padding: '0.625rem 1.25rem', backgroundColor: 'var(--primary-color)', color: 'white', 
                fontWeight: '500', borderRadius: 'var(--radius)', border:'none', cursor:'pointer',
                boxShadow: 'var(--shadow)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'
            }}
            className="hover:bg-primary-dark-color focus-ring"
          >
            <i className="fas fa-save"></i>Save Settings
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
                padding: '0.625rem 1.25rem', backgroundColor: 'var(--bg-tertiary)', 
                color: 'var(--text-primary)', fontWeight: '500', 
                borderRadius: 'var(--radius)', border:'1px solid var(--border-color)', cursor: 'pointer',
                boxShadow:'var(--shadow)'
            }}
            className="hover:bg-border-color focus-ring"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiSettingsModal;
