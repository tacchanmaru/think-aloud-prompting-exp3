'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductImageUploadPhase from '../components/ProductImageUploadPhase';
import Timer from '../components/Timer';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ThinkAloudExperimentResult, IntermediateStep } from '../../lib/types';


// =========== ThinkAloudPage Component ===========
function ThinkAloudPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    const { stopTimer, getStartTimeISO, getEndTimeISO, getDurationSeconds } = useTimer();
    const { userId } = useAuth();
    
    const [mode, setMode] = useState<'upload' | 'edit'>('upload');
    
    // Application state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Text editing state
    const [textContent, setTextContent] = useState('');
    const [modificationHistory, setModificationHistory] = useState<{
        utterance: string;
        editPlan: string;
        originalText: string;
        modifiedText: string;
    }[]>([]);
    const [historySummary, setHistorySummary] = useState('');
    const [originalText, setOriginalText] = useState('');
    
    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptItems, setTranscriptItems] = useState<{id: number, text: string, utteranceText: string, isProcessed: boolean}[]>([]);
    
    // Utterance buffering state (matching archive backend logic)
    const [utteranceBuffer, setUtteranceBuffer] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const lastCompleteTimeRef = useRef<number>(Date.now());
    
    const websocketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isConnectedRef = useRef<boolean>(false);
    const isRecordingStateRef = useRef<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);

    // Buffer processing logic (matching archive backend) - moved inline to processBufferedUtterances

    const processTextModification = useCallback(async (utterance: string) => {
        try {
            console.log('Processing text modification for utterance:', utterance);
            console.log('Current text:', textContent);
            
            const response = await fetch('/api/text-modification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: textContent,
                    utterance: utterance,
                    imageBase64: imagePreview ? imagePreview.split(',')[1] : undefined,
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
                
                // Update text content
                const previousText = textContent;
                setTextContent(result.modifiedText);
                
                // Add to modification history
                const newHistoryItem = {
                    utterance: utterance,
                    editPlan: result.plan || '',
                    originalText: previousText,
                    modifiedText: result.modifiedText,
                };
                
                setModificationHistory(prev => [...prev, newHistoryItem]);
                
                // TODO: Update history summary (could be done with another API call)
                
                console.log('Text successfully modified');
            } else {
                console.log('No modification needed for utterance:', utterance);
            }
            
        } catch (error) {
            console.error('Error in text modification:', error);
            throw error; // Re-throw to be handled by caller
        }
    }, [textContent, imagePreview, modificationHistory, historySummary]);

    const processBufferedUtterances = useCallback(async () => {
        if (isProcessing) return;
        
        // Check buffer conditions inline
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
            // Get all utterances and clear buffer
            const utterancesToProcess = [...utteranceBuffer];
            setUtteranceBuffer([]);
            
            // Combine utterances (matching archive backend)
            const combinedUtterance = utterancesToProcess.join('');
            
            console.log('Processing buffered utterances:', utterancesToProcess);
            
            await processTextModification(combinedUtterance);
            
            // Clear only the transcript items that were processed
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

    // Periodic buffer check (matching archive backend - 0.1 second intervals)
    useEffect(() => {
        const intervalId = setInterval(() => {
            processBufferedUtterances();
        }, 100); // 0.1 seconds

        return () => clearInterval(intervalId);
    }, [processBufferedUtterances]); // Dependencies for useEffect

    const handleUploadComplete = (imageFile: File, imagePreview: string, generatedText: string) => {
        setImagePreview(imagePreview);
        setTextContent(generatedText);
        setOriginalText(generatedText);
        setMode('edit');
        
        // Automatically start recording when entering edit mode
        setTimeout(() => {
            startRecording();
        }, 500); // Small delay to ensure UI has updated
    };

    const handleRecordClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        setError(null);
        if (isRecording) return;

        try {
            setIsTranscribing(true);
            isConnectedRef.current = false;

            // Get ephemeral token for direct WebSocket connection
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

            // Setup direct WebSocket connection with subprotocols
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
                setIsTranscribing(false);

                // Send transcription session configuration
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

                // Setup audio processing
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: 24000, channelCount: 1 }
                    });
                    streamRef.current = stream;

                    // Create audio worklet processor code inline
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
                                // Add to utterance buffer (only if not empty)
                                const utterance = message.transcript.trim();
                                if (utterance) {
                                    // Add new transcript item for display
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
        setIsTranscribing(false);

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

    const handleComplete = async () => {
        try {
            // タイマーを停止
            stopTimer();
            
            // 実験データを準備
            const experimentData: ThinkAloudExperimentResult = {
                userId: userId || 0, // 1-100の範囲のuserId
                experimentType: 'think-aloud',
                productId: 'product1', // 現在はproduct1固定
                originalText,
                finalText: textContent,
                startTime: getStartTimeISO() || new Date().toISOString(),
                endTime: getEndTimeISO(),
                durationSeconds: getDurationSeconds(),
                intermediateSteps: modificationHistory.map(item => ({
                    utterance: item.utterance,
                    edit_plan: item.editPlan,
                    modified_text: item.modifiedText,
                    history_summary: historySummary
                })),
                isPracticeMode: isPractice,
            };

            // 保存を試行
            const saveSuccess = await saveExperimentData(experimentData);
            
            if (saveSuccess) {
                alert('実験が完了し、データが正常に保存されました。ありがとうございました。');
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
            <Timer />
            {mode === 'upload' ? (
                <ProductImageUploadPhase onComplete={handleUploadComplete} />
            ) : (
                <div className="product-layout">
                    <div className="product-image-container">
                        {imagePreview && (
                            <img src={imagePreview} alt="商品画像" className="product-image" />
                        )}
                    </div>
                    <div className="product-description-container">
                        <div className="text-header">
                            <h3>商品説明</h3>
                        </div>
                            <textarea
                                className={`text-editor ${isRecording ? 'recording' : ''}`}
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="商品説明を編集してください..."
                                rows={10}
                            />
                            <div className="controls">
                                <div className="transcription-display">
                                    <div className="transcription-header">
                                        {isProcessing ? '⚙️ テキスト修正中...' : isRecording ? '🎙️ 音声認識中' : isTranscribing ? '接続中...' : '音声入力待機中'}
                                        {utteranceBuffer.length > 0 && !isProcessing && (
                                            <span className="buffer-status">
                                                （バッファ: {utteranceBuffer.length}件）
                                            </span>
                                        )}
                                    </div>
                                    <div className="transcript-items">
                                        {transcriptItems.map((item) => (
                                            <span key={item.id} className="transcript-bubble">
                                                {item.text}
                                            </span>
                                        ))}
                                        {transcriptItems.length === 0 && (
                                            <span className="no-transcript">
                                                まだ音声が認識されていません
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="complete-button-full"
                                    onClick={handleComplete}
                                    disabled={isProcessing || modificationHistory.length === 0}
                                >
                                    完了
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {error && <div className="error">{error}</div>}
        </div>
    );
}

export default ThinkAloudPage;