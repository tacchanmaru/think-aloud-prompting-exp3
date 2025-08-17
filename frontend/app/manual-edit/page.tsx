'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductImageUploadPhase from '../components/ProductImageUploadPhase';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { saveExperimentData } from '../../lib/experimentService';
import { ManualExperimentResult } from '../../lib/types';
import { ExperimentPageType } from '../../lib/experimentUtils';


// =========== ManualEditPage Component ===========
function ManualEditPage() {
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
    const [originalText, setOriginalText] = useState('');
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

    // Adjust height whenever textContent changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [textContent]);

    const handleUploadComplete = async (imageFile: File, imagePreview: string, generatedText: string) => {
        setImagePreview(imagePreview);
        setTextContent(generatedText);
        setOriginalText(generatedText); // 元のテキストとして保存
        setMode('edit');
    };

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
                productId: 'product1', // 現在はproduct1固定
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
            {mode === 'upload' ? (
                <ProductImageUploadPhase onComplete={handleUploadComplete} isPractice={isPractice} pageType={ExperimentPageType.ManualEdit} />
            ) : (
                <div className="product-layout">
                    <div className="product-image-container">
                        {imagePreview && (
                            <img src={imagePreview} alt="商品画像" className="product-image" />
                        )}
                    </div>
                    <div className="product-description-container">
                        <div className="text-header">
                            <h3 className="product-description-header">商品説明</h3>
                        </div>
                            <textarea
                                ref={textareaRef}
                                className="text-editor"
                                value={textContent}
                                onChange={handleTextChange}
                                placeholder="商品説明を編集してください..."
                                style={{ 
                                    minHeight: 'calc(12px * 1.6 * 5)',
                                    resize: 'vertical',
                                    whiteSpace: 'pre-line',
                                    wordWrap: 'break-word',
                                    boxSizing: 'border-box'
                                }}
                                onInput={adjustTextareaHeight}
                            />
                            <div className="controls">
                                <button
                                    className="complete-button-full"
                                    onClick={handleComplete}
                                    disabled={!hasEdited}
                                >
                                    編集完了
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