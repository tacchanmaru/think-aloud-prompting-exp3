'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmailDisplayPhase from '../components/EmailDisplayPhase';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ManualExperimentResult } from '../../lib/types';
import { getEmailForExperiment } from '../../lib/experimentUtils';
import { ExperimentPageType } from '../../lib/experimentUtils';


// =========== ManualEditPage Component ===========
function ManualEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    const { stopTimer, getStartTimeISO, getEndTimeISO, getDurationSeconds } = useTimer();
    const { userId } = useAuth();
    
    const [mode, setMode] = useState<'display' | 'edit'>('display');
    
    // Application state
    const [emailData, setEmailData] = useState<any>(null);
    
    // Text editing state
    const [replyContent, setReplyContent] = useState('');
    const [originalReply, setOriginalReply] = useState('');
    const [hasEdited, setHasEdited] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const minHeight = 96; // calc(12px * 1.6 * 5) ≈ 96px
            textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, minHeight) + 'px';
        }
    };

    // Adjust height whenever replyContent changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [replyContent]);

    const handleEmailDisplayComplete = async (email: any, emailPreview: string, initialReplyText: string) => {
        setEmailData(email);
        setReplyContent(initialReplyText);
        setOriginalReply(initialReplyText); // 元の返信文として保存
        setMode('edit');
    };

    const handleReplyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        setReplyContent(newValue);
        
        // Check if reply has been edited
        if (newValue !== originalReply && !hasEdited) {
            setHasEdited(true);
        }
    };

    const handleComplete = async () => {
        try {
            // タイマーを停止
            stopTimer();
            
            // 実験データを準備
            const currentEmail = getEmailForExperiment(userId, ExperimentPageType.ManualEdit, isPractice);
            const experimentData: ManualExperimentResult = {
                userId: userId || 0, // 1-100の範囲のuserId
                experimentType: 'manual',
                emailId: emailData?.id || currentEmail.id,
                originalEmail: currentEmail.content,
                emailSubject: currentEmail.subject,
                replyText: replyContent,
                startTime: getStartTimeISO() || new Date().toISOString(),
                endTime: getEndTimeISO(),
                durationSeconds: getDurationSeconds(),
                isPracticeMode: isPractice,
            };

            // 保存を試行
            const saveSuccess = await saveExperimentData(experimentData);
            
            if (saveSuccess) {
                alert('メール返信実験が完了しました。管理者にお知らせください。');
            } else {
                alert('実験は完了しましたが、データの保存に失敗しました。管理者にお知らせください。');
            }
            
        } catch (error) {
            console.error('Complete error:', error);
            alert('実験は完了しましたが、データの保存中にエラーが発生しました。管理者にお知らせください。');
        } finally {
            router.push('/');
        }
    };

    return (
        <div className="app-container">
            {mode === 'display' ? (
                <EmailDisplayPhase onComplete={handleEmailDisplayComplete} isPractice={isPractice} pageType={ExperimentPageType.ManualEdit} />
            ) : (
                <div className="email-layout">
                    <div className="received-email-container">
                        <div className="email-content">
                            <div className="email-subject">件名: {emailData?.subject}</div>
                            <div className="email-from">差出人: {emailData?.sender}</div>
                            <div>{emailData?.content}</div>
                        </div>
                    </div>
                    <div className="reply-email-container">
                        <div className="text-header">
                            <h3 className="reply-email-header">返信文</h3>
                        </div>
                        <textarea
                            ref={textareaRef}
                            className="text-editor"
                            value={replyContent}
                            onChange={handleReplyChange}
                            placeholder="返信内容を入力してください..."
                            style={{ 
                                minHeight: 'calc(12px * 1.6 * 5)',
                                resize: 'vertical',
                                whiteSpace: 'pre-line',
                                wordWrap: 'break-word',
                                boxSizing: 'border-box',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                padding: '12px',
                                width: '100%'
                            }}
                            onInput={adjustTextareaHeight}
                        />
                        <div className="controls">
                            <button
                                className="complete-button-full"
                                onClick={handleComplete}
                                disabled={!hasEdited}
                            >
                                返信
                            </button>
                        </div>
                    </div>
                </div>
                )}
        </div>
    );
}

function ManualEditPageWithSuspense() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ManualEditPage />
        </Suspense>
    );
}

export default ManualEditPageWithSuspense;