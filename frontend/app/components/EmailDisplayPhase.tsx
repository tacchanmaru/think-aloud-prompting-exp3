'use client';

import { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { email1, email2, practiceEmail } from '../../lib/emails';
import { useTimer } from '../contexts/TimerContext';
import { getEmailForExperiment, ExperimentPageType } from '../../lib/experimentUtils';
import { useAuth } from '../contexts/AuthContext';

interface EmailDisplayPhaseProps {
    onComplete: (email: any, emailPreview: string, initialReplyText: string) => Promise<void>;
    isPractice?: boolean;
    pageType: ExperimentPageType;
    onMicrophoneConnecting?: (isConnecting: boolean) => void;
}

const EmailDisplayPhase: React.FC<EmailDisplayPhaseProps> = ({ onComplete, isPractice = false, pageType, onMicrophoneConnecting }) => {
    const { userId } = useAuth();
    const currentEmail = getEmailForExperiment(userId, pageType, isPractice);
    const [error, setError] = useState<string | null>(null);
    const [showStartButton, setShowStartButton] = useState(true);
    const [isConnectingMicrophone, setIsConnectingMicrophone] = useState(false);
    
    const { startTimer } = useTimer();

    const handleStartEditing = async () => {
        try {
            setIsConnectingMicrophone(true);
            
            // メール情報を準備
            const emailData = {
                id: currentEmail.id,
                subject: currentEmail.subject,
                content: currentEmail.content,
                sender: currentEmail.sender
            };
            
            // 空の返信文で開始
            const initialReplyText = '';
            
            // Wait for parent to handle microphone permission + WebSocket connection
            await onComplete(emailData, currentEmail.content, initialReplyText);
        } catch (error) {
            console.error('Failed to start editing:', error);
            setError('編集の開始に失敗しました。');
            setIsConnectingMicrophone(false);
        }
    };

    return (
        <div className="upload-phase">
            <div className="product-layout">
                <p className="target-product">受信メール</p>
                
                <div className="email-container">
                    <div className="email-header">
                        <FaEnvelope />
                        <div className="email-meta">
                            <div className="email-from">差出人: {currentEmail.sender}</div>
                            <div className="email-subject">件名: {currentEmail.subject}</div>
                        </div>
                    </div>
                    <div className="email-content">
                        {currentEmail.content}
                    </div>
                </div>
                
                {showStartButton && (
                    <div>
                        {isConnectingMicrophone && (
                            <div className="microphone-connecting">
                                <div className="spinner"></div>
                                <p>マイクに接続中...</p>
                            </div>
                        )}
                        <button 
                            className="start-edit-button"
                            onClick={handleStartEditing}
                            disabled={isConnectingMicrophone}
                        >
                            {isConnectingMicrophone ? '接続中...' : '返信文作成開始'}
                        </button>
                    </div>
                )}
                
                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default EmailDisplayPhase;