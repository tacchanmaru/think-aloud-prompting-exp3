'use client';

import { useState, useRef, useEffect, FC, useCallback, useMemo } from 'react';
import { FaMicrophone, FaStop, FaShareAlt, FaCog, FaTimes, FaUser, FaTrash } from 'react-icons/fa';
import { format as formatDate } from 'date-fns';
import { useAuth } from './contexts/AuthContext';

interface Note {
    id: string;
    content: string;
    createdAt: Date;
}

interface Settings {
    scrapboxProject: string;
    scrapboxTitleFormat: string;
    scrapboxUserName: string;
}

// =========== User ID Component ===========
const UserIdSetting = () => {
    const { userId, setUserId } = useAuth();
    const [inputValue, setInputValue] = useState(userId?.toString() || '');

    const handleSave = () => {
        const id = parseInt(inputValue, 10);
        if (id >= 1 && id <= 100) {
            setUserId(id);
        } else {
            alert('ユーザーIDは1-100の範囲で入力してください。');
        }
    };

    const handleClear = () => {
        setUserId(null);
        setInputValue('');
    };

    return (
        <div className="auth-section">
            <h4>ユーザー設定</h4>
            <div className="setting-item">
                <label htmlFor="userId">ユーザーID (1-100)</label>
                <input
                    id="userId"
                    type="number"
                    min="1"
                    max="100"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="1-100の数字を入力"
                />
                <div className="user-id-actions">
                    <button onClick={handleSave} className="auth-button">
                        <FaUser />
                        設定
                    </button>
                    {userId && (
                        <button onClick={handleClear} className="auth-button">
                            クリア
                        </button>
                    )}
                </div>
            </div>
            {userId && (
                <p className="setting-help">現在のユーザーID: {userId}</p>
            )}
        </div>
    );
};

// =========== SettingsModal Component ===========
const SettingsModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (newSettings: Settings) => void;
}> = ({ isOpen, onClose, settings, onSave }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings, isOpen]);

    useEffect(() => {
        // モバイル判定の初期化とリサイズ対応
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        // モバイルの場合、body のスクロールを制御
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isMobile]);

    const { userId } = useAuth();

    const handleSettingChange = useCallback((key: keyof Settings, value: string) => {
        const newSettings = { ...currentSettings, [key]: value };
        setCurrentSettings(newSettings);
        onSave(newSettings);
    }, [currentSettings, onSave]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isMobile) {
            onClose();
        }
    };

    const SettingsContent = useMemo(() => (
        <>
            <div className={isMobile ? "mobile-settings-header" : "modal-header"}>
                <h2>設定</h2>
                <button onClick={onClose} className="close-button"><FaTimes /></button>
            </div>
            <div className={isMobile ? "mobile-settings-body" : "modal-body"}>
                <UserIdSetting />
            </div>
        </>
    ), [isMobile, onClose]);

    if (!isOpen) return null;

    if (isMobile) {
        return (
            <div className="mobile-settings-overlay">
                <div className="mobile-settings-content">
                    {SettingsContent}
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                {SettingsContent}
            </div>
        </div>
    );
};

// =========== MemosPage Component ===========
function MemosPage() {
    const { userId, isHydrated } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        scrapboxProject: '',
        scrapboxTitleFormat: '',
        scrapboxUserName: '',
    });
    const notesListRef = useRef<HTMLDivElement>(null);

    const websocketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isConnectedRef = useRef<boolean>(false);
    const isRecordingStateRef = useRef<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll on new notes
    useEffect(() => {
        if (notesListRef.current) {
            notesListRef.current.scrollTop = notesListRef.current.scrollHeight;
        }
    }, [notes]);

    // Data loading from localStorage
    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem('notes-app-data');
            if (savedNotes) {
                const localNotes: { id: number, content: string, createdAt: string }[] = JSON.parse(savedNotes);
                setNotes(localNotes.map(n => ({
                    id: String(n.id),
                    content: n.content,
                    createdAt: new Date(n.createdAt)
                })));
            } else {
                setNotes([]);
            }

            const savedSettings = localStorage.getItem('notes-app-settings');
            if (savedSettings) setSettings(JSON.parse(savedSettings));

        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            setError("データの読み込みに失敗しました。");
        }
    }, []);

    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem('notes-app-settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error("Failed to save settings", e);
            setError("設定の保存に失敗しました。");
        }
    };

    const handleRecordClick = () => {
        console.log('🎤 handleRecordClick');
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
            console.log('🎤 Starting recording...');
            setIsTranscribing(true); // Show "connecting" status
            isConnectedRef.current = false;

            if (newNoteContent.trim().length > 0) {
                setNewNoteContent(prev => prev + '\n');
            }

            // 1. Get ephemeral token for direct WebSocket connection
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

            console.log('🔗 Attempting direct WebSocket connection...');

            // 2. Setup direct WebSocket connection with subprotocols
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
                console.log('✅ WebSocket connection established');
                isConnectedRef.current = true;
                isRecordingStateRef.current = true;
                setIsRecording(true); // Set recording state only after connection is established
                setIsTranscribing(false); // Clear connecting status

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
                console.log('📤 Sending session config:', configMessage);
                ws.send(JSON.stringify(configMessage));

                // 3. Setup audio processing
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
                                this.chunkSize = this.sampleRate * 0.1; // 100ms chunks
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

                    // Resume context if it's suspended
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }

                    // Add AudioWorklet module from blob
                    const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
                    const workletURL = URL.createObjectURL(blob);
                    await audioContext.audioWorklet.addModule(workletURL);
                    URL.revokeObjectURL(workletURL);

                    const source = audioContext.createMediaStreamSource(stream);
                    const pcmProcessor = new AudioWorkletNode(audioContext, 'pcm-processor');
                    audioWorkletNodeRef.current = pcmProcessor;

                    let audioSendCounter = 0;
                    pcmProcessor.port.onmessage = (event) => {
                        if (ws.readyState === WebSocket.OPEN && event.data) {
                            try {
                                const buffer = Buffer.from(event.data);
                                const base64Audio = buffer.toString('base64');

                                audioSendCounter++;
                                if (audioSendCounter % 20 === 0) {
                                    console.log(`🎙️ Sending audio data (packet #${audioSendCounter})`);
                                }

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
                // Ignore messages if recording has been stopped
                if (!isConnectedRef.current || !isRecordingStateRef.current) {
                    console.log('🚫 Ignoring message - recording stopped');
                    return;
                }

                const message = JSON.parse(event.data);
                console.log('📥 WebSocket message:', message);

                switch (message.type) {
                    case 'conversation.item.input_audio_transcription.completed':
                        // Double-check recording state before processing transcription
                        if (isConnectedRef.current && isRecordingStateRef.current) {
                            console.log('📝 Transcription completed:', message);
                            if (message.transcript) {
                                console.log('📝 Final transcript:', message.transcript);
                                setNewNoteContent(prev => prev + message.transcript);
                            }
                        } else {
                            console.log('🚫 Ignoring transcription - recording stopped');
                        }
                        break;
                    case 'input_audio_buffer.speech_started':
                        console.log('🎙️ Speech started');
                        break;
                    case 'input_audio_buffer.speech_stopped':
                        console.log('🛑 Speech stopped');
                        break;
                    case 'error':
                        console.error('❌ Server error:', message);
                        setError(`OpenAI API エラー: ${message.error?.message || 'Unknown error'}`);
                        break;
                    default:
                        if (message.type.includes('transcription') || message.type.includes('audio')) {
                            console.log(`🔍 Audio/Transcription event: ${message.type}`, message);
                        }
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setError(`WebSocket接続エラーが発生しました。`);
                stopRecording();
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                // Only show error if recording was not manually stopped
                if (isConnectedRef.current && isRecording) {
                    console.log('⚠️ Unexpected WebSocket closure during recording');
                    setError(`WebSocket接続が予期せず閉じられました: ${event.reason || 'Unknown reason'}`);
                    stopRecording();
                } else {
                    console.log('ℹ️ WebSocket closed normally (manual stop or cleanup)');
                }
            };

        } catch (error) {
            const message = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
            setError(`録音開始に失敗しました: ${message}`);
            stopRecording();
        }
    };

    const stopRecording = () => {
        console.log("button clicked")
        console.log('🛑 Stopping recording...');

        // Set flags immediately to prevent recursive calls
        isConnectedRef.current = false;
        isRecordingStateRef.current = false;
        setIsRecording(false);
        setIsTranscribing(false);

        // Send buffer clear command before closing WebSocket
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            console.log('🧹 Clearing audio buffer...');
            try {
                websocketRef.current.send(JSON.stringify({
                    type: 'input_audio_buffer.clear'
                }));
                // Give a small delay for the clear command to be processed
                setTimeout(() => {
                    if (websocketRef.current) {
                        console.log('🔌 Closing WebSocket...');
                        websocketRef.current.close();
                        websocketRef.current = null;
                    }
                }, 100);
            } catch (error) {
                console.warn('Failed to clear audio buffer:', error);
                websocketRef.current.close();
                websocketRef.current = null;
            }
        } else if (websocketRef.current) {
            console.log('🔌 Closing WebSocket...');
            websocketRef.current.close();
            websocketRef.current = null;
        }

        if (audioWorkletNodeRef.current) {
            console.log('🎵 Disconnecting AudioWorklet...');
            audioWorkletNodeRef.current.disconnect();
            audioWorkletNodeRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            console.log('🎙️ Closing AudioContext...');
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (streamRef.current) {
            console.log('📱 Stopping media stream...');
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        console.log('✅ Recording stopped successfully');
    };

    const handleSaveNote = async () => {
        const contentToSave = newNoteContent.trim();
        if (!contentToSave) return;

        const newNoteForScrapbox: Note = {
            id: '', // Will be set later
            content: contentToSave,
            createdAt: new Date(),
        };

        const localId = Date.now().toString();
        newNoteForScrapbox.id = localId;
        const updatedNotes = [...notes, newNoteForScrapbox];
        setNotes(updatedNotes);
        try {
            localStorage.setItem('notes-app-data', JSON.stringify(updatedNotes.map(n => ({ ...n, id: parseInt(n.id) }))));
        } catch {
            setError("メモのローカル保存に失敗しました。");
        }
        setNewNoteContent('');
    };


    const handleShareNote = async (note: Note) => {
        const formattedDate = formatDate(note.createdAt, 'yyyy/MM/dd HH:mm');
        const textToShare = `${note.content}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Memo from ${formattedDate}`,
                    text: textToShare,
                });
            } catch (error) {
                console.log('Share failed:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(textToShare);
                alert('共有機能が利用できないため、メモの内容をクリップボードにコピーしました。');
            } catch {
                alert('クリップボードへのコピーに失敗しました。');
            }
        }
    };


    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm("このメモを完全に削除しますか？")) return;
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        try {
            localStorage.setItem('notes-app-data', JSON.stringify(updatedNotes.map(n => ({ ...n, id: parseInt(n.id, 10) }))));
        } catch {
            setError("メモの削除に失敗しました。");
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const canSave = newNoteContent.trim() && !isRecording;
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault(); // 新しい行が入力されるのを防ぐ
            if (canSave) {
                handleSaveNote();
            }
        }
    };

    return (
        <div className="memos-container">
            <header className="main-header">
                <div className="header-content">
                    <h1>{!isHydrated ? 'My Whisper' : (userId ? `ユーザー${userId}` : '未ログイン')}</h1>
                    <button className="settings-button" onClick={() => setIsSettingsOpen(true)}>
                        <FaCog />
                    </button>
                </div>
            </header>

            <div className="content-area">
                <div className="notes-list" ref={notesListRef}>
                    {notes.map(note => (
                        <div key={note.id} className="note-card">
                            <div className="note-content">
                                <p className="note-paragraph" dangerouslySetInnerHTML={{ __html: note.content.replace(/\\n/g, '<br />') }}></p>
                            </div>
                            <div className="note-footer">
                                <span>{formatDate(note.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                                <div className="note-card-actions">
                                    <button className="share-button" onClick={() => handleShareNote(note)}>
                                        <FaShareAlt />
                                    </button>
                                    <button className="delete-button" onClick={() => handleDeleteNote(note.id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className="empty-state">
                            <img src="/images/ferret.jpeg" alt="フェレット" className="empty-state-image" />
                            <p>まだメモがありません。</p>
                            <p>下のマイクボタンを押して、最初のメモを録音しましょう。</p>
                            {isHydrated && !userId && <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>ユーザーIDを設定すると、データを識別できます。</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className={`new-memo-area ${isRecording ? 'recording' : ''}`}>
                <div className="new-memo-content">
                    <div className="textarea-wrapper" data-replicated-value={newNoteContent}>
                        <textarea
                            ref={textareaRef}
                            className={`memo-input ${isRecording || isTranscribing ? 'recording' : ''}`}
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="今何考えてる？"
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    {(isRecording || isTranscribing) && (
                        <div className={`status-overlay ${isRecording ? 'recording-status' : ''}`}>
                            {isTranscribing && !isRecording && (
                                "接続中..."
                            )}
                        </div>
                    )}
                    <div className="memo-actions">
                        <div className="main-actions">
                            <>
                                {isRecording &&
                                    <div className="recording-indicator">
                                        <div className="wave-animation">
                                            <span className="wave-bar"></span>
                                            <span className="wave-bar"></span>
                                            <span className="wave-bar"></span>
                                        </div>
                                        <span className="recording-text">文字起こし中</span>
                                    </div>
                                }
                                <button
                                    className={`record-button ${isRecording ? 'recording' : ''}`}
                                    onClick={handleRecordClick}
                                >
                                    {isRecording ? <FaStop /> : <FaMicrophone />}
                                </button>
                                <button
                                    className="post-button"
                                    onClick={handleSaveNote}
                                    disabled={!newNoteContent.trim() || isRecording}
                                >
                                    投稿
                                </button>
                            </>
                        </div>
                    </div>
                </div>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
            />
            {error && <div className="error">{error}</div>}
        </div>
    );
}

export default MemosPage;