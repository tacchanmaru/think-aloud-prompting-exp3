'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMailForExperiment, ExperimentPageType } from '../../lib/experimentUtils';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ManualExperimentResult } from '../../lib/types';


// =========== ManualEditPage Component ===========
function ManualEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    const { stopTimer, getStartTimeISO, getEndTimeISO, getDurationSeconds } = useTimer();
    const { userId } = useAuth();
    
    // Get the mail data for this user
    const currentMail = getMailForExperiment(userId, ExperimentPageType.ManualEdit, isPractice);
    
    // Text editing state - initialize with mail text
    const [textContent, setTextContent] = useState(currentMail.text);
    const [originalText, setOriginalText] = useState(currentMail.text);
    const [hasEdited, setHasEdited] = useState(false);

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        setTextContent(newValue);
        
        // Check if text has been edited
        if (newValue !== originalText && !hasEdited) {
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
                finalText: textContent,
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
                <div className="mail-header">
                    <h2>メールの編集</h2>
                    <p className="target-mail">件名：{currentMail.subject}</p>
                </div>
                <div className="mail-content-container">
                    <div className="text-header">
                        <h3 className="mail-content-header">メール本文</h3>
                    </div>
                    <textarea
                        className="text-editor"
                        value={textContent}
                        onChange={handleTextChange}
                        placeholder="メール本文を編集してください..."
                        rows={15}
                    />
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