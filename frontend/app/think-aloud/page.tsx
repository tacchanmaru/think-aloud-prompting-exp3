'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmailDisplayPhase from '../components/EmailDisplayPhase';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ThinkAloudExperimentResult } from '../../lib/types';
import { Email } from '../../lib/emails';
import { ExperimentPageType } from '../../lib/experimentUtils';

// =========== ThinkAloudPage Component ===========
function ThinkAloudPage() {
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
    
    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptItems, setTranscriptItems] = useState<{id: number, text: string, utteranceText: string, isProcessed: boolean}[]>([]);
    
    // Utterance buffering state
    const [utteranceBuffer, setUtteranceBuffer] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const lastCompleteTimeRef = useRef<number>(Date.now());
    const [isDescriptionClicked, setIsDescriptionClicked] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pastUtterances, setPastUtterances] = useState<string>('');
    
    const websocketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isConnectedRef = useRef<boolean>(false);
    const isRecordingStateRef = useRef<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);
    const descriptionDisplayRef = useRef<HTMLDivElement | null>(null);
    const isWaitingPermissionRef = useRef<boolean>(false);

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
                    pastUtterances: pastUtterances,
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
                
                const previousText = replyContent;
                setReplyContent(result.modifiedText);
                
                const newHistoryItem = {
                    utterance: utterance,
                    editPlan: result.plan || '',
                    originalText: previousText,
                    modifiedText: result.modifiedText,
                    pastUtterances: pastUtterances,
                    historySummary: historySummary,
                };
                
                const updatedHistory = [...modificationHistory, newHistoryItem];
                setModificationHistory(updatedHistory);
                
                updateHistorySummary(updatedHistory);
                
                console.log('Text successfully modified');
            } else {
                console.log('No modification needed for utterance:', utterance);
            }
            
        } catch (error) {
            console.error('Error in text modification:', error);
            throw error;
        }
    }, [replyContent, emailData, modificationHistory, historySummary, pastUtterances, updateHistorySummary]);

    const processBufferedUtterances = useCallback(async () => {
        if (isProcessing) return;
        
        let shouldProcess = false;
        if (utteranceBuffer.length >= 3) {
            console.log(`Buffer full, processing ${utteranceBuffer.length} utterances`);
            shouldProcess = true;
        } else if (utteranceBuffer.length > 0) {
            const currentTime = Date.now();
            const timeSinceLastComplete = (currentTime - lastCompleteTimeRef.current) / 1000;
            if (timeSinceLastComplete >= 4.0) {
                console.log(`Timeout processing after ${timeSinceLastComplete.toFixed(1)} seconds`);
                shouldProcess = true;
            }
        }
        
        if (!shouldProcess || utteranceBuffer.length === 0) return;
        
        setIsProcessing(true);
        
        try {
            const utterancesToProcess = [...utteranceBuffer];
            setUtteranceBuffer([]);
            
            const combinedUtterance = utterancesToProcess.join('');
            
            console.log('Processing buffered utterances:', utterancesToProcess);
            
            await processTextModification(combinedUtterance);
            
            setPastUtterances(prev => {
                if (prev) {
                    return prev + '、' + combinedUtterance;
                } else {
                    return combinedUtterance;
                }
            });
            
            setTranscriptItems(prev => prev.filter(item => 
                !utterancesToProcess.includes(item.utteranceText)
            ));
            
        } catch (error) {
            console.error('Error processing buffered utterances:', error);
            setError(`テキスト修正中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsProcessing(false);
        }
    }, [utteranceBuffer, isProcessing, processTextModification]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            processBufferedUtterances();
        }, 100);

        return () => clearInterval(intervalId);
    }, [processBufferedUtterances]);

    const getPreviousText = () => {
        if (modificationHistory.length > 0) {
            if (modificationHistory.length === 1) return originalText;
            if (modificationHistory.length >= 2) return modificationHistory[modificationHistory.length - 2].modifiedText;
            return originalText;
        }
        return originalText;
    };

    const calculateLineDiff = (originalText: string, currentText: string) => {
        const originalLines = originalText.split('\n');
        const currentLines = currentText.split('\n');
        
        const lcs = calculateLCS(originalLines, currentLines);
        const result: Array<{ content: string; type: 'unchanged' | 'added' | 'removed' }> = [];
        
        let i = 0, j = 0, k = 0;
        
        while (i < originalLines.length || j < currentLines.length) {
            if (k < lcs.length && i < originalLines.length && j < currentLines.length && 
                originalLines[i] === lcs[k] && currentLines[j] === lcs[k]) {
                result.push({ content: currentLines[j], type: 'unchanged' });
                i++;
                j++;
                k++;
            } else if (i < originalLines.length && (k >= lcs.length || originalLines[i] !== lcs[k])) {
                result.push({ content: originalLines[i], type: 'removed' });
                i++;
            } else if (j < currentLines.length && (k >= lcs.length || currentLines[j] !== lcs[k])) {
                result.push({ content: currentLines[j], type: 'added' });
                j++;
            }
        }
        
        return result;
    };

    const calculateLCS = (arr1: string[], arr2: string[]): string[] => {
        const m = arr1.length;
        const n = arr2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (arr1[i - 1] === arr2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
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
        
        try {
            await startRecordingAndWaitForConnection();
            startTimer();
            setMode('edit');
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError('録音の開始に失敗しました。ページを更新してもう一度お試しください。');
        }
    };

    const startRecordingAndWaitForConnection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            await startRecording();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } catch (error) {
            console.error('Microphone permission denied:', error);
            setError('マイクの許可が必要です。ブラウザの設定を確認してください。');
            throw error;
        }
    };

    const startRecording = async () => {
        setError(null);
        if (isRecording) return;

        try {
            isConnectedRef.current = false;

            const tokenResponse = await fetch('/api/auth/openai-token', { method: 'POST' });
            if (!tokenResponse.ok) {
                const errorBody = await tokenResponse.text();
                throw new Error(`Ephemeral tokenの取得に失敗しました。 Status: ${tokenResponse.status}, Body: ${errorBody}`);
            }
            const responseData = await tokenResponse.json();
            const ephemeralToken = responseData.token;

            if (typeof ephemeralToken !== 'string') {
                console.error("無効なephemeral tokenを受信しました:", responseData);
                throw new Error('Ephemeral tokenが文字列ではありません。');
            }

            const ws = new WebSocket(
                'wss://api.openai.com/v1/realtime?intent=transcription',
                [
                    'realtime',
                    `openai-insecure-api-key.${ephemeralToken}`,
                    'openai-beta.realtime-v1',
                ]
            );
            websocketRef.current = ws;

            ws.onopen = async () => {
                isConnectedRef.current = true;
                isRecordingStateRef.current = true;
                setIsRecording(true);
                
                if (isWaitingPermissionRef.current) {
                    startTimer();
                    setMode('edit');
                    isWaitingPermissionRef.current = false;
                }

                const configMessage = {
                    type: 'transcription_session.update',
                    session: {
                        input_audio_transcription: {
                            model: 'gpt-4o-transcribe',
                            language: 'ja',
                        },
                        input_audio_noise_reduction: { type: 'near_field' },
                        turn_detection: {
                            type: 'server_vad',
                        },
                    },
                };
                ws.send(JSON.stringify(configMessage));

                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: 24000, channelCount: 1 }
                    });
                    streamRef.current = stream;

                    const audioWorkletCode = `
                        class PCMProcessor extends AudioWorkletProcessor {
                            constructor() {
                                super();
                                this.sampleRate = 24000;
                                this.chunkSize = this.sampleRate * 0.1;
                                this.buffer = [];
                            }

                            process(inputs, outputs, parameters) {
                                const input = inputs[0];
                                if (input && input[0]) {
                                    const float32Data = input[0];
                                    this.buffer.push(...float32Data);

                                    while (this.buffer.length >= this.chunkSize) {
                                        const chunk = this.buffer.slice(0, this.chunkSize);
                                        this.buffer = this.buffer.slice(this.chunkSize);

                                        const int16Buffer = new Int16Array(chunk.length);
                                        for (let i = 0; i < chunk.length; i++) {
                                            int16Buffer[i] = Math.max(-1, Math.min(1, chunk[i])) * 0x7fff;
                                        }

                                        this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);
                                    }
                                }
                                return true;
                            }
                        }
                        registerProcessor('pcm-processor', PCMProcessor);
                    `;

                    const audioContext = new AudioContext({ sampleRate: 24000 });
                    audioContextRef.current = audioContext;

                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }

                    const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
                    const workletURL = URL.createObjectURL(blob);
                    await audioContext.audioWorklet.addModule(workletURL);
                    URL.revokeObjectURL(workletURL);

                    const source = audioContext.createMediaStreamSource(stream);
                    const pcmProcessor = new AudioWorkletNode(audioContext, 'pcm-processor');
                    audioWorkletNodeRef.current = pcmProcessor;

                    pcmProcessor.port.onmessage = (event) => {
                        if (ws.readyState === WebSocket.OPEN && event.data) {
                            try {
                                const buffer = Buffer.from(event.data);
                                const base64Audio = buffer.toString('base64');

                                ws.send(JSON.stringify({
                                    type: 'input_audio_buffer.append',
                                    audio: base64Audio,
                                }));
                            } catch (audioError) {
                                console.warn('Failed to send audio data:', audioError);
                            }
                        }
                    };

                    source.connect(pcmProcessor);
                    pcmProcessor.connect(audioContext.destination);

                } catch (audioErr) {
                    console.error("Error accessing microphone:", audioErr);
                    setError(`マイクアクセスエラー: ${audioErr instanceof Error ? audioErr.message : String(audioErr)}`);
                }
            };

            ws.onmessage = (event) => {
                if (!isConnectedRef.current || !isRecordingStateRef.current) {
                    return;
                }

                const message = JSON.parse(event.data);

                switch (message.type) {
                    case 'conversation.item.input_audio_transcription.completed':
                        if (isConnectedRef.current && isRecordingStateRef.current) {
                            if (message.transcript) {
                                console.log('Transcript received:', message.transcript);
                                const utterance = message.transcript.trim();
                                if (utterance) {
                                    const newItem = {
                                        id: Date.now(),
                                        text: message.transcript,
                                        utteranceText: utterance,
                                        isProcessed: false
                                    };
                                    setTranscriptItems(prev => [...prev, newItem]);
                                    
                                    setUtteranceBuffer(prev => [...prev, utterance]);
                                    lastCompleteTimeRef.current = Date.now();
                                    console.log(`Added utterance to buffer: "${utterance}"`);
                                }
                            }
                        }
                        break;
                    case 'error':
                        console.error('Server error:', message);
                        setError(`OpenAI API エラー: ${message.error?.message || 'Unknown error'}`);
                        break;
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError(`WebSocket接続エラーが発生しました。`);
                stopRecording();
            };

            ws.onclose = (event) => {
                if (isConnectedRef.current && isRecording) {
                    setError(`WebSocket接続が予期せず閉じられました: ${event.reason || 'Unknown reason'}`);
                    stopRecording();
                }
            };

        } catch (error) {
            const message = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
            setError(`録音開始に失敗しました: ${message}`);
            stopRecording();
        }
    };

    const stopRecording = () => {
        isConnectedRef.current = false;
        isRecordingStateRef.current = false;
        setIsRecording(false);

        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
                websocketRef.current.send(JSON.stringify({
                    type: 'input_audio_buffer.clear'
                }));
                setTimeout(() => {
                    if (websocketRef.current) {
                        websocketRef.current.close();
                        websocketRef.current = null;
                    }
                }, 100);
            } catch (error) {
                console.warn('Failed to clear audio buffer:', error);
                if (websocketRef.current) {
                    websocketRef.current.close();
                    websocketRef.current = null;
                }
            }
        } else if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.disconnect();
            audioWorkletNodeRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleComplete = () => {
        setShowConfirmDialog(true);
    };

    const handleConfirmComplete = async () => {
        setShowConfirmDialog(false);
        
        try {
            stopTimer();
            
            const experimentData: ThinkAloudExperimentResult = {
                userId: userId || 0,
                experimentType: 'think-aloud',
                emailId: emailData?.id || '',
                originalEmail: emailData?.content || '',
                emailSubject: emailData?.subject || '',
                replyText: replyContent,
                startTime: getStartTimeISO() || new Date().toISOString(),
                endTime: getEndTimeISO(),
                durationSeconds: getDurationSeconds(),
                intermediateSteps: modificationHistory.map(item => ({
                    utterance: item.utterance,
                    past_utterances: item.pastUtterances,
                    edit_plan: item.editPlan,
                    modified_text: item.modifiedText,
                    history_summary: item.historySummary
                })),
                isPracticeMode: isPractice,
            };

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
                <EmailDisplayPhase onComplete={handleEmailDisplayComplete} isPractice={isPractice} pageType={ExperimentPageType.ThinkAloud} />
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
                            <div className="transcription-display">
                                <div className="transcription-header">
                                    {isProcessing ? '⚙️ テキスト修正中...' : '🎙️ 音声認識中'}
                                </div>
                                <div className="transcript-items">
                                    {transcriptItems.length === 0 ? (
                                        <span className="no-transcript">
                                            まだ音声が認識されていません
                                        </span>
                                    ) : (
                                        <span className="transcript-text">
                                            {transcriptItems.map((item) => item.text).join('')}
                                        </span>
                                    )}
                                </div>
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

function ThinkAloudPageWithSuspense() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ThinkAloudPage />
        </Suspense>
    );
}

export default ThinkAloudPageWithSuspense;