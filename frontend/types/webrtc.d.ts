// types/webrtc.d.ts

// Web Speech APIの型をグローバルなWindowインターフェースに拡張
interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    webkitAudioContext: typeof AudioContext;
} 