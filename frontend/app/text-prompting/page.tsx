'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmailDisplayPhase from '../components/EmailDisplayPhase';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { TextPromptingExperimentResult } from '../../lib/types';
import { Email } from '../../lib/emails';
import { ExperimentPageType } from '../../lib/experimentUtils';

// =========== TextPromptingPage Component ===========
function TextPromptingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    const { startTimer, stopTimer, getStartTimeISO, getEndTimeISO, getDurationSeconds } = useTimer();
    const { userId } = useAuth();
    
    const [mode, setMode] = useState<'display' | 'edit'>('display');
    
    // Application state
    const [emailData, setEmailData] = useState<Email | null>(null);
    
    // Text editing state
    const [replyContent, setReplyContent] = useState('');
    const [modificationHistory, setModificationHistory] = useState<{
        utterance: string;
        editPlan: string;
        originalText: string;
        modifiedText: string;
        pastUtterances: string;
        historySummary: string;
    }[]>([]);
    const [historySummary, setHistorySummary] = useState('');
    const [originalText, setOriginalText] = useState('');
    
    // Text prompting state
    const [promptText, setPromptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDescriptionClicked, setIsDescriptionClicked] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    
    const descriptionDisplayRef = useRef<HTMLDivElement | null>(null);

    // 戻る操作を無効化するためのuseEffect
    useEffect(() => {
        const preventBack = () => {
            window.history.pushState(null, '', window.location.href);
        };

        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };

        // 初期状態で履歴を追加
        preventBack();

        // popstateイベントリスナーを追加
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const updateHistorySummary = useCallback(async (history: typeof modificationHistory) => {
        // history summaryの更新は編集履歴が2つ以上の場合のみ実行
        if (history.length < 2) {
            return;
        }

        try {
            console.log('Updating history summary for', history.length, 'modifications');
            
            const response = await fetch('/api/history-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    history: history.map(item => ({
                        utterance: item.utterance,
                        editPlan: item.editPlan,
                        originalText: item.originalText,
                        modifiedText: item.modifiedText,
                    })),
                    currentSummary: historySummary
                }),
            });

            if (!response.ok) {
                throw new Error(`History summary API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.historySummary) {
                setHistorySummary(result.historySummary);
                console.log('History summary updated:', result.historySummary);
            }
            
        } catch (error) {
            console.error('Error updating history summary:', error);
            // History summary更新の失敗は致命的エラーではないため、メイン処理は継続
        }
    }, [historySummary]);

    const processTextModification = useCallback(async (utterance: string) => {
        try {
            console.log('Processing text modification for utterance:', utterance);
            console.log('Current text:', replyContent);
            
            const response = await fetch('/api/text-modification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: replyContent,
                    utterance: utterance,
                    pastUtterances: '',
                    originalEmail: emailData?.content,
                    emailSubject: emailData?.subject,
                    history: modificationHistory,
                    historySummary: historySummary
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            if (result.shouldEdit && result.modifiedText) {
                console.log('Text modification applied:', result.plan);
                
                // Update reply content
                const previousText = replyContent;
                setReplyContent(result.modifiedText);
                
                // Add to modification history
                const newHistoryItem = {
                    utterance: utterance,
                    editPlan: result.plan || '',
                    originalText: previousText,
                    modifiedText: result.modifiedText,
                    pastUtterances: '',
                    historySummary: historySummary,
                };
                
                const updatedHistory = [...modificationHistory, newHistoryItem];
                setModificationHistory(updatedHistory);
                
                // Update history summary asynchronously
                updateHistorySummary(updatedHistory);
                
                console.log('Text successfully modified');
            } else {
                console.log('No modification needed for utterance:', utterance);
            }
            
        } catch (error) {
            console.error('Error in text modification:', error);
            throw error; // Re-throw to be handled by caller
        }
    }, [replyContent, emailData, modificationHistory, historySummary, updateHistorySummary]);

    // 前のテキストを取得する関数
    const getPreviousText = () => {
        if (modificationHistory.length > 0) {
            if (modificationHistory.length === 1) return originalText;
            if (modificationHistory.length >= 2) return modificationHistory[modificationHistory.length - 2].modifiedText;
            return originalText;
        }
        return originalText;
    };

    // 行単位での差分を計算する関数
    const calculateLineDiff = (originalText: string, currentText: string) => {
        const originalLines = originalText.split('\n');
        const currentLines = currentText.split('\n');
        
        // LCS（最長共通部分列）を使用した差分計算
        const lcs = calculateLCS(originalLines, currentLines);
        const result: Array<{ content: string; type: 'unchanged' | 'added' | 'removed' }> = [];
        
        let i = 0, j = 0, k = 0;
        
        while (i < originalLines.length || j < currentLines.length) {
            if (k < lcs.length && i < originalLines.length && j < currentLines.length && 
                originalLines[i] === lcs[k] && currentLines[j] === lcs[k]) {
                // 共通の行
                result.push({ content: currentLines[j], type: 'unchanged' });
                i++;
                j++;
                k++;
            } else if (i < originalLines.length && (k >= lcs.length || originalLines[i] !== lcs[k])) {
                // 削除された行
                result.push({ content: originalLines[i], type: 'removed' });
                i++;
            } else if (j < currentLines.length && (k >= lcs.length || currentLines[j] !== lcs[k])) {
                // 追加された行
                result.push({ content: currentLines[j], type: 'added' });
                j++;
            }
        }
        
        return result;
    };

    // 最長共通部分列（LCS）を計算する関数
    const calculateLCS = (arr1: string[], arr2: string[]): string[] => {
        const m = arr1.length;
        const n = arr2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        // DPテーブルを構築
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (arr1[i - 1] === arr2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        // LCSを復元
        const lcs: string[] = [];
        let i = m, j = n;
        
        while (i > 0 && j > 0) {
            if (arr1[i - 1] === arr2[j - 1]) {
                lcs.unshift(arr1[i - 1]);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        
        return lcs;
    };

    const handleEmailDisplayComplete = async (email: Email, emailPreview: string, initialReplyText: string) => {
        setEmailData(email);
        setReplyContent(initialReplyText);
        setOriginalText(initialReplyText);
        
        // Start timer and switch to edit mode
        startTimer();
        setMode('edit');
    };

    const handlePromptSubmit = async () => {
        if (!promptText.trim() || isProcessing) return;
        
        setError(null);
        setIsProcessing(true);
        
        try {
            // Process text modification
            await processTextModification(promptText.trim());
            
            // Clear prompt input
            setPromptText('');
            
        } catch (error) {
            console.error('Error processing prompt:', error);
            setError(`テキスト修正中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePromptSubmit();
        }
    };

    const handleComplete = () => {
        setShowConfirmDialog(true);
    };

    const handleConfirmComplete = async () => {
        setShowConfirmDialog(false);
        
        try {
            // タイマーを停止
            stopTimer();
            
            // 実験データを準備
            const experimentData: TextPromptingExperimentResult = {
                userId: userId || 0, // 1-100の範囲のuserId
                experimentType: 'text-prompting',
                emailId: emailData?.id || '',
                originalEmail: emailData?.content || '',
                emailSubject: emailData?.subject || '',
                replyText: replyContent,
                startTime: getStartTimeISO() || new Date().toISOString(),
                endTime: getEndTimeISO(),
                durationSeconds: getDurationSeconds(),
                intermediateSteps: modificationHistory.map(item => ({
                    utterance: item.utterance,
                    past_utterances: '',
                    edit_plan: item.editPlan,
                    modified_text: item.modifiedText,
                    history_summary: item.historySummary
                })),
                isPracticeMode: isPractice,
            };

            // 保存を試行
            const saveSuccess = await saveExperimentData(experimentData);
            
            if (saveSuccess) {
                alert('実験が完了しました。ありがとうございました。');
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

    const handleCancelComplete = () => {
        setShowConfirmDialog(false);
    };

    return (
        <div className="app-container">
            {mode === 'display' ? (
                <EmailDisplayPhase onComplete={handleEmailDisplayComplete} isPractice={isPractice} pageType={ExperimentPageType.TextPrompting} />
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
                            <h3 className="product-description-header">返信文（タップで削除行も表示）</h3>
                        </div>
                        <div
                            ref={descriptionDisplayRef}
                            className="text-editor cursor-pointer select-none"
                            onTouchStart={() => setIsDescriptionClicked(true)}
                            onTouchEnd={() => setIsDescriptionClicked(false)}
                            style={{ 
                                minHeight: 'calc(12px * 1.6 * 5)',
                                whiteSpace: 'pre-line', 
                                wordWrap: 'break-word' 
                            }}
                        >
                            {replyContent ? (
                                modificationHistory.length > 0 ? (
                                    <div>
                                        {calculateLineDiff(getPreviousText() || '', replyContent)
                                            .filter(line => isDescriptionClicked || line.type !== 'removed')
                                            .map((line, index) => (
                                            <div
                                                key={index}
                                                className={`${
                                                    line.type === 'added'
                                                        ? 'bg-yellow-100'
                                                        : line.type === 'removed'
                                                        ? 'bg-red-100'
                                                        : 'bg-white'
                                                } ${line.content.trim() === '' ? 'min-h-[1em]' : ''}`}
                                            >
                                                {line.content || '\u00A0'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>{replyContent}</div>
                                )
                            ) : (
                                <span style={{ color: '#888' }}>返信文を編集してください...</span>
                            )}
                        </div>
                        <div className="controls">
                            <div className="prompt-input-container">
                                <textarea
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="どのように返信しますか..."
                                    className="prompt-input"
                                    rows={3}
                                    disabled={isProcessing}
                                />
                                <button
                                    onClick={handlePromptSubmit}
                                    disabled={!promptText.trim() || isProcessing}
                                    className="send-button"
                                >
                                    {isProcessing ? '送信中...' : '送信'}
                                </button>
                            </div>
                            <button
                                className="complete-button-full"
                                onClick={handleComplete}
                                disabled={isProcessing || modificationHistory.length === 0}
                            >
                                編集完了
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="error">{error}</div>}
            
            <ConfirmationDialog
                isOpen={showConfirmDialog}
                title="編集完了の確認"
                message="本当に編集を完了しますか？"
                onConfirm={handleConfirmComplete}
                onCancel={handleCancelComplete}
                confirmText="はい"
                cancelText="いいえ"
            />
        </div>
    );
}

function TextPromptingPageWithSuspense() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TextPromptingPage />
        </Suspense>
    );
}

export default TextPromptingPageWithSuspense;