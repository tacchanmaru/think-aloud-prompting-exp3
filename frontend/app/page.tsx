'use client';

import { useState, useEffect, useCallback, useMemo, FC } from 'react';
import { FaCog, FaTimes, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

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

    return (
        <div className="auth-section">
            <h4>ユーザー設定</h4>
            <div className="setting-item">
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

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isMobile) {
            onClose();
        }
    };

    const SettingsContent = (
        <>
            <div className={isMobile ? "mobile-settings-header" : "modal-header"}>
                <h2>設定</h2>
                <button onClick={onClose} className="close-button"><FaTimes /></button>
            </div>
            <div className={isMobile ? "mobile-settings-body" : "modal-body"}>
                <UserIdSetting />
            </div>
        </>
    );

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

// =========== HomePage Component ===========
function HomePage() {
    const { userId, isHydrated } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        scrapboxProject: '',
        scrapboxTitleFormat: '',
        scrapboxUserName: '',
    });
    const router = useRouter();

    // Data loading from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('notes-app-settings');
            if (savedSettings) setSettings(JSON.parse(savedSettings));
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }, []);

    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        try {
            localStorage.setItem('notes-app-settings', JSON.stringify(newSettings));
        } catch (e) {
            console.error("Failed to save settings", e);
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
                <div className="home-menu">
                    <div className="menu-card">
                        <div className="menu-section">
                            <div className="section-title">練習用</div>
                            <button 
                                className={`menu-button practice ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/manual-edit?practice=true")}
                                disabled={!userId}
                            >
                                手動編集（練習用）
                            </button>
                            <button 
                                className={`menu-button practice ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/text-prompting?practice=true")}
                                disabled={!userId}
                            >
                                テキストAI（練習用）
                            </button>
                            <button 
                                className={`menu-button practice ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/think-aloud?practice=true")}
                                disabled={!userId}
                            >
                                思考発話AI（練習用）
                            </button>
                        </div>
                        
                        <div className="menu-divider"></div>
                        
                        <div className="menu-section">
                            <div className="section-title">実験</div>
                            <button 
                                className={`menu-button ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/manual-edit")}
                                disabled={!userId}
                            >
                                手動編集
                            </button>
                            <button 
                                className={`menu-button ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/text-prompting")}
                                disabled={!userId}
                            >
                                テキストAI
                            </button>
                            <button 
                                className={`menu-button ${!userId ? 'disabled' : ''}`}
                                onClick={() => userId && router.push("/think-aloud")}
                                disabled={!userId}
                            >
                                思考発話AI
                            </button>
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
        </div>
    );
}

export default HomePage;