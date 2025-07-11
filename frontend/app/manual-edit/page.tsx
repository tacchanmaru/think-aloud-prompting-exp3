'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductImageUploadPhase from '../components/ProductImageUploadPhase';


// =========== ManualEditPage Component ===========
function ManualEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPractice = searchParams.get('practice') === 'true';
    
    const [mode, setMode] = useState<'upload' | 'edit'>('upload');
    
    // Application state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Text editing state
    const [textContent, setTextContent] = useState('');


    const handleUploadComplete = (imageFile: File, imagePreview: string, generatedText: string) => {
        setImagePreview(imagePreview);
        setTextContent(generatedText);
        setMode('edit');
    };

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextContent(event.target.value);
    };

    const handleComplete = () => {
        alert('実験が完了しました。ありがとうございました。');
        router.push('/');
    };

    return (
        <div className="app-container">
            <div className="content-area">
                {mode === 'upload' ? (
                    <ProductImageUploadPhase onComplete={handleUploadComplete} />
                ) : (
                    <div className="edit-phase">
                        <div className="image-section">
                            {imagePreview && (
                                <img src={imagePreview} alt="商品画像" className="product-image" />
                            )}
                        </div>
                        <div className="text-section">
                            <div className="text-header">
                                <h3>商品説明</h3>
                            </div>
                            <textarea
                                className="text-editor"
                                value={textContent}
                                onChange={handleTextChange}
                                placeholder="商品説明を編集してください..."
                                rows={10}
                            />
                            <div className="controls">
                                <button
                                    className="complete-button-full"
                                    onClick={handleComplete}
                                >
                                    完了
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManualEditPage;