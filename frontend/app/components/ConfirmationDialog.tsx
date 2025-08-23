'use client';

import { useEffect, useRef } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'はい',
  cancelText = 'いいえ'
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const confirmButton = dialogRef.current.querySelector('.confirm-button') as HTMLButtonElement;
      if (confirmButton) {
        confirmButton.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} ref={dialogRef}>
      <div className="modal-content" style={{ maxWidth: '300px' }}>
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        
        <div className="modal-body">
          <p style={{ 
            marginBottom: '24px', 
            fontSize: '16px', 
            lineHeight: '1.5',
            color: '#212529',
            textAlign: 'center'
          }}>
            {message}
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              className="menu-button"
              style={{
                flex: '1',
                maxWidth: '120px',
                height: '60px',
                backgroundColor: '#6c757d',
                color: 'white'
              }}
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className="menu-button confirm-button"
              style={{
                flex: '1',
                maxWidth: '120px',
                height: '60px'
              }}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}