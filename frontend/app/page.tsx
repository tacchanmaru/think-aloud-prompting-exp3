'use client';

import { useState, useRef, useEffect, FC, useCallback, useMemo } from 'react';
import { FaMicrophone, FaStop, FaShareAlt, FaCog, FaTimes, FaGoogle, FaSignOutAlt, FaTrash, FaCamera } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';
import { format as formatDate } from 'date-fns';
import { useAuth } from './contexts/AuthContext';
import { db } from '../lib/firebase/client';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, Timestamp, writeBatch, doc, getDoc, deleteDoc } from 'firebase/firestore';

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

// =========== Auth Component ===========
const Auth = () => {
    const { user, signInWithGoogle, signOut } = useAuth();

    return (
        <div className="auth-section">
            <h4>アカウント連携</h4>
            {user ? (
                <div className="user-info">
                    <img src={user.photoURL || undefined} alt={user.displayName || 'user'} className="user-avatar" />
                    <span className="user-name">{user.displayName}</span>
                    <button onClick={signOut} className="auth-button">
                        <FaSignOutAlt />
                        サインアウト
                    </button>
                </div>
            ) : (
                <>
                    <p className="setting-help">Googleアカウントでサインインすると、複数の端末でメモを同期・バックアップできます。</p>
                    <button onClick={signInWithGoogle} className="auth-button google-signin">
                        <FaGoogle />
                        Googleでサインイン
                    </button>
                </>
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
    gyazoToken: string | null;
    onGyazoDisconnect: () => void;
}> = ({ isOpen, onClose, settings, onSave, gyazoToken, onGyazoDisconnect }) => {
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

    const clientId = process.env.NEXT_PUBLIC_GYAZO_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gyazo/callback`;
    const gyazoAuthUrl = `https://gyazo.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

    // フックは常に同じ順序で呼ぶ必要がある
    const { user } = useAuth();
    const isGyazoAvailable = !!user;

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
                <Auth />
                <hr className="divider" />
                <h4>Gyazo連携</h4>
                {gyazoToken ? (
                    <div>
                        <p className="setting-help">Gyazoアカウントと連携済みです。</p>
                        <button onClick={onGyazoDisconnect} className="auth-button">連携を解除</button>
                    </div>
                ) : isGyazoAvailable ? (
                    <div>
                        <p className="setting-help">お使いのGyazoアカウントに画像をアップロードするには、連携が必要です。</p>
                        <a href={gyazoAuthUrl} className="auth-button google-signin">Gyazoと連携する</a>
                    </div>
                ) : (
                    <div>
                        <p className="setting-help error-message">Gyazo連携を利用するには、まずGoogleアカウントでサインインしてください。</p>
                        <button className="auth-button disabled" disabled>Gyazoと連携する</button>
                    </div>
                )}
                <hr className="divider" />
                <h4>Scrapbox連携</h4>
                <div className="setting-item">
                    <label htmlFor="scrapboxUserName">ユーザ名</label>
                    <input
                        id="scrapboxUserName"
                        type="text"
                        value={currentSettings.scrapboxUserName || ''}
                        onChange={(e) => handleSettingChange('scrapboxUserName', e.target.value)}
                    />
                </div>
                <div className="setting-item">
                    <label htmlFor="scrapboxProject">Scrapbox プロジェクト名</label>
                    <input
                        id="scrapboxProject"
                        type="text"
                        value={currentSettings.scrapboxProject}
                        onChange={(e) => handleSettingChange('scrapboxProject', e.target.value)}
                    />
                </div>
                <div className="setting-item">
                    <label htmlFor="scrapboxTitleFormat">Scrapbox 日付形式</label>
                    <input
                        id="scrapboxTitleFormat"
                        type="text"
                        value={currentSettings.scrapboxTitleFormat}
                        onChange={(e) => handleSettingChange('scrapboxTitleFormat', e.target.value)}
                    />
                    <p className="setting-help">
                        <code>{'yyyy'}</code>, <code>{'MM'}</code>, <code>{'dd'}</code> が使用できます。例: <code>{'yyyy-MM-dd'}</code>
                    </p>
                </div>
            </div>
        </>
    ), [isMobile, onClose, gyazoToken, onGyazoDisconnect, gyazoAuthUrl, isGyazoAvailable, currentSettings, handleSettingChange]);

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
    const { user, loading } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        scrapboxProject: 'rchujo',
        scrapboxTitleFormat: 'yyyyMMdd',
        scrapboxUserName: 'chujo',
    });
    const notesListRef = useRef<HTMLDivElement>(null);

    const websocketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const isConnectedRef = useRef<boolean>(false);
    const isRecordingStateRef = useRef<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [gyazoToken, setGyazoToken] = useState<string | null>(null);

    // Auto-scroll on new notes
    useEffect(() => {
        if (notesListRef.current) {
            notesListRef.current.scrollTop = notesListRef.current.scrollHeight;
        }
    }, [notes]);

    // Data loading, migration, and real-time sync logic
    useEffect(() => {
        if (loading) return;

        if (user) {
            const migrateAndLoadFirestore = async () => {
                const localNotesData = localStorage.getItem('notes-app-data');
                if (localNotesData) {
                    try {
                        const localNotes: { id: number, content: string, createdAt: string }[] = JSON.parse(localNotesData);
                        if (localNotes.length > 0) {
                            const batch = writeBatch(db);
                            const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
                            localNotes.forEach(note => {
                                const docRef = doc(notesCollectionRef);
                                batch.set(docRef, {
                                    content: note.content,
                                    createdAt: new Date(note.createdAt)
                                });
                            });
                            await batch.commit();
                            localStorage.removeItem('notes-app-data');
                        }
                    } catch (e) {
                        console.error("Failed to migrate local data", e);
                        setError("ローカルデータの移行に失敗しました。");
                    }
                }

                try {
                    const savedSettings = localStorage.getItem(`notes-app-settings-${user.uid}`);
                    if (savedSettings) setSettings(JSON.parse(savedSettings));
                } catch (e) { console.error("Failed to load user settings", e); }

                const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
                const q = query(notesCollectionRef, orderBy('createdAt'));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const userNotes: Note[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.createdAt) {
                            userNotes.push({
                                id: doc.id,
                                content: data.content,
                                createdAt: (data.createdAt as Timestamp).toDate()
                            });
                        }
                    });
                    setNotes(userNotes);
                }, (err) => {
                    console.error("Error fetching notes:", err);
                    setError("メモの読み込みに失敗しました。");
                });

                // Check for Gyazo token
                const gyazoDocRef = doc(db, 'users', user.uid, 'integrations', 'gyazo');
                getDoc(gyazoDocRef).then(docSnap => {
                    if (docSnap.exists()) {
                        setGyazoToken(docSnap.data().accessToken);
                    } else {
                        setGyazoToken(null);
                    }
                });

                return () => unsubscribe();
            };

            migrateAndLoadFirestore();

        } else {
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
            setGyazoToken(null); // Clear token on logout
        }
    }, [user, loading]);

    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        try {
            const key = user ? `notes-app-settings-${user.uid}` : 'notes-app-settings';
            localStorage.setItem(key, JSON.stringify(newSettings));
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

        if (user) {
            try {
                const notesCollectionRef = collection(db, 'users', user.uid, 'notes');
                const newNoteDoc = await addDoc(notesCollectionRef, {
                    content: contentToSave,
                    createdAt: serverTimestamp(),
                });
                newNoteForScrapbox.id = newNoteDoc.id;

            } catch (error) {
                console.error("Error saving note to Firestore:", error);
                setError("メモの保存に失敗しました。");
                return;
            }
        }
        else {
            const localId = Date.now().toString();
            newNoteForScrapbox.id = localId;
            const updatedNotes = [...notes, newNoteForScrapbox];
            setNotes(updatedNotes);
            try {
                localStorage.setItem('notes-app-data', JSON.stringify(updatedNotes.map(n => ({ ...n, id: parseInt(n.id) }))));
            } catch {
                setError("メモのローカル保存に失敗しました。");
            }
        }
        setNewNoteContent('');
        handleSendToScrapbox(newNoteForScrapbox);
    };

    const handleResetNote = () => {
        setNewNoteContent('');
    };

    const handleSendToScrapbox = (note: Note) => {
        const time = formatDate(note.createdAt, 'HH:mm');
        const body = `[${settings.scrapboxUserName}.icon] ${time}\n${note.content}`;
        const encodedContent = encodeURIComponent(body);
        const pageTitle = settings.scrapboxTitleFormat
            .replace(/yyyy/g, formatDate(note.createdAt, 'yyyy'))
            .replace(/MM/g, formatDate(note.createdAt, 'MM'))
            .replace(/dd/g, formatDate(note.createdAt, 'dd'));
        const url = `https://scrapbox.io/${settings.scrapboxProject}/${encodeURIComponent(pageTitle)}?body=${encodedContent}`;
        window.open(url, '_blank', 'noopener,noreferrer');
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

    const closeCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        streamRef.current = null;
        setIsCameraOpen(false);
    }, []);

    const takePhotoAndUpload = useCallback(async () => {
        if (!videoRef.current || !gyazoToken) {
            setError("Gyazoと連携してください。");
            return;
        }
        setIsUploading(true);

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setError("写真の撮影に失敗しました。");
            setIsUploading(false);
            closeCamera();
            return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            closeCamera();

            if (!blob) {
                setError("写真データの変換に失敗しました。");
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append('image', blob);
            formData.append('accessToken', gyazoToken);

            try {
                const response = await fetch('/api/upload-gyazo', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Gyazoへのアップロードに失敗しました。');
                }

                const result = await response.json();
                const imageUrl = result.url;
                const textToInsert = `[${imageUrl}]`;

                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newText = newNoteContent.substring(0, start) + textToInsert + newNoteContent.substring(end);
                    setNewNoteContent(newText);

                    setTimeout(() => {
                        textarea.focus();
                        textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
                    }, 0);
                } else {
                    setNewNoteContent(prev => `${prev} ${textToInsert}`);
                }

            } catch (error: unknown) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("画像のアップロード中に予期せぬエラーが発生しました。");
                }
            } finally {
                setIsUploading(false);
            }
        }, 'image/jpeg');
    }, [newNoteContent, closeCamera, gyazoToken]);

    const handleCameraButtonClick = useCallback(async () => {
        if (isCameraOpen) {
            await takePhotoAndUpload();
        } else {
            setError(null);
            // アウトカメラ（背面カメラ）を優先して要求する
            const videoConstraints = { video: { facingMode: 'environment' } };

            try {
                const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraOpen(true);
            } catch (err) {
                console.warn("アウトカメラの取得に失敗したため、デフォルトのカメラを試します。", err);
                // アウトカメラがない場合（PCなど）や、ユーザーが許可しなかった場合に備える
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setIsCameraOpen(true);
                } catch (finalErr) {
                    console.error("カメラへのアクセスに失敗しました。", finalErr);
                    setError("カメラへのアクセス許可が必要です。");
                    setIsCameraOpen(false);
                }
            }
        }
    }, [isCameraOpen, takePhotoAndUpload]);

    const handleGyazoDisconnect = async () => {
        if (!user) return;
        const gyazoDocRef = doc(db, 'users', user.uid, 'integrations', 'gyazo');
        try {
            await deleteDoc(gyazoDocRef);
            setGyazoToken(null);
        } catch (error) {
            console.error("Failed to disconnect Gyazo:", error);
            setError("Gyazo連携の解除に失敗しました。");
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!user) {
            // For local storage
            if (!window.confirm("このメモを完全に削除しますか？")) return;
            const updatedNotes = notes.filter(note => note.id !== noteId);
            setNotes(updatedNotes);
            try {
                localStorage.setItem('notes-app-data', JSON.stringify(updatedNotes.map(n => ({ ...n, id: parseInt(n.id, 10) }))));
            } catch {
                setError("メモの削除に失敗しました。");
            }
            return;
        };

        if (!window.confirm("このメモを完全に削除しますか？この操作は取り消せません。")) return;

        try {
            const noteDocRef = doc(db, 'users', user.uid, 'notes', noteId);
            await deleteDoc(noteDocRef);
        } catch (error) {
            console.error("Error deleting note:", error);
            setError("メモの削除に失敗しました。");
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const canSave = newNoteContent.trim() && !isRecording && !isCameraOpen;
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault(); // 新しい行が入力されるのを防ぐ
            if (canSave) {
                handleSaveNote();
            }
        }
    };

    if (loading) {
        return <div className="loading-container">読み込み中...</div>;
    }

    return (
        <div className="memos-container">
            <header className="main-header">
                <div className="header-content">
                    <h1>{user ? `${user.displayName}のメモ` : 'My Whisper'}</h1>
                    <button className="settings-button" onClick={() => {
                        if (isCameraOpen) closeCamera();
                        setIsSettingsOpen(true);
                    }}>
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
                            <p>まだメモがありません。</p>
                            <p>下のマイクボタンを押して、最初のメモを録音しましょう。</p>
                            {!user && <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>データを複数端末で同期するには、設定画面からサインインしてください。</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className={`new-memo-area ${isRecording ? 'recording' : ''}`}>
                <div className={`new-memo-content ${isCameraOpen ? 'camera-mode' : ''}`}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`video-preview ${isCameraOpen ? 'visible' : ''}`}
                    />
                    <div className={`textarea-wrapper ${isCameraOpen ? 'hidden' : ''}`} data-replicated-value={newNoteContent}>
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
                        <button
                            className="reset-button"
                            onClick={isCameraOpen ? closeCamera : handleResetNote}
                            disabled={isRecording}
                        >
                            {isCameraOpen ? <FaTimes /> : <FaTrash />}
                        </button>
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
                                    disabled={isCameraOpen}
                                >
                                    {isRecording ? <FaStop /> : <FaMicrophone />}
                                </button>
                                <button
                                    className="camera-button"
                                    onClick={handleCameraButtonClick}
                                    disabled={isRecording || isUploading || !gyazoToken}
                                    title={!gyazoToken ? "Gyazoと連携してください" : "写真を撮影"}
                                >
                                    {isUploading ? <ImSpinner2 className="animate-spin" /> : <FaCamera />}
                                </button>
                                <button
                                    className="post-button"
                                    onClick={handleSaveNote}
                                    disabled={!newNoteContent.trim() || isRecording || isCameraOpen}
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
                gyazoToken={gyazoToken}
                onGyazoDisconnect={handleGyazoDisconnect}
            />
            {error && <div className="error">{error}</div>}
        </div>
    );
}

export default MemosPage;