'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMailForExperiment, ExperimentPageType, generateReceivedMail, generateInitialReply, combineReplyAndReceived } from '../../lib/experimentUtils';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ManualExperimentResult } from '../../lib/types';
import ReceivedMailBlock from '../components/ReceivedMailBlock';


// =========== ManualEditPage Component ===========
function ManualEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    const { stopTimer, getStartTimeISO, getEndTimeISO, getDurationSeconds } = useTimer();
    const { userId } = useAuth();
    
    // Get the mail data for this user
    const currentMail = getMailForExperiment(userId, ExperimentPageType.ManualEdit, isPractice);
    
    // Separate reply and received mail management
    const [reply, setReply] = useState('');
    const receivedMail = generateReceivedMail(currentMail);
    const [hasEdited, setHasEdited] = useState(false);
    
    // Combined text for saving
    const combinedText = combineReplyAndReceived(reply, receivedMail);
    const originalText = combineReplyAndReceived('', receivedMail);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus on the first line when component mounts
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(0, 0);
        }
    }, []);

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        setReply(newValue);
        
        // Check if text has been edited
        if (newValue !== '' && !hasEdited) {
            setHasEdited(true);
        }
    };

    const handleComplete = async () => {
        try {
            // タイマーを停止
            stopTimer();
            
            // 実験データを準備
            const experimentData: ManualExperimentResult = {
                userId: userId || 0, // 1-100の範囲のuserId
                experimentType: 'manual',
                mailId: 'mail1', // 現在はmail1固定
                originalText,
                finalText: combinedText,
                startTime: getStartTimeISO() || new Date().toISOString(),
                endTime: getEndTimeISO(),
                durationSeconds: getDurationSeconds(),
                isPracticeMode: isPractice,
            };

            // 保存を試行
            const saveSuccess = await saveExperimentData(experimentData);
            
            if (saveSuccess) {
                alert('実験が完了しました。管理者にお知らせください。');
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
            <div className="mail-layout">
                <div className="mail-content-container">
                    <div className="mail-header">
                        <p className="target-mail">件名：Re: {currentMail.subject}</p>
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="text-editor"
                        value={reply}
                        onChange={handleTextChange}
                        placeholder="返信内容を入力してください..."
                        rows={10}
                    />
                    
                    <ReceivedMailBlock receivedMail={receivedMail} />
                    
                    <div className="controls">
                        <button
                            className="complete-button-full"
                            onClick={handleComplete}
                            disabled={!hasEdited}
                        >
                            完了
                        </button>
                    </div>
                </div>
            </div>
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