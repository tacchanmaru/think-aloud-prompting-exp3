'use client';

import { useState, useRef } from 'react';
import { FaImage } from 'react-icons/fa';
import { product1 } from '../../lib/products';
import { useTimer } from '../contexts/TimerContext';

interface ProductImageUploadPhaseProps {
    onComplete: (imageFile: File, imagePreview: string, generatedText: string) => void;
}

const ProductImageUploadPhase: React.FC<ProductImageUploadPhaseProps> = ({ onComplete }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [showStartButton, setShowStartButton] = useState(false);
    
    const { startTimer } = useTimer();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset input value to allow selecting the same file again
        event.target.value = '';
    };

    const handleTakePhoto = () => {
        cameraInputRef.current?.click();
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleUseDefaultImage = () => {
        // Use the ferret image that already exists in public/images/
        const defaultImageUrl = '/images/ferret.jpeg';
        
        // Create a sample file object for consistency
        fetch(defaultImageUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'ferret.jpeg', { type: 'image/jpeg' });
                setImageFile(file);
                setImagePreview(defaultImageUrl);
            })
            .catch(err => {
                console.error('Failed to load default image:', err);
                setError('デフォルト画像の読み込みに失敗しました。');
            });
    };

    const generateDescriptionFromImage = async () => {
        if (!imageFile || !imagePreview) return;
        
        setIsGenerating(true);
        setError(null);
        
        try {
            // TODO: Implement API call to generate product description
            // For now, simulate with a delay and generate sample text based on image
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Use ferret product text from products.ts
            const randomText = product1.text;
            
            // Store the generated text and show the start button
            setGeneratedText(randomText);
            setShowStartButton(true);
        } catch (err) {
            setError('テキスト生成に失敗しました。');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartEditing = () => {
        if (imageFile && imagePreview && generatedText) {
            startTimer(); // タイマーを開始
            onComplete(imageFile, imagePreview, generatedText);
        }
    };

    return (
        <div className="upload-phase">
            <div className="product-layout">
                <h2>画像から商品説明を生成</h2>
                <div className="product-image-container">
                    {imagePreview ? (
                        <img src={imagePreview} alt="選択された画像" className="product-image" />
                    ) : (
                        <div className="upload-placeholder clickable-upload" onClick={handleTakePhoto}>
                            <FaImage />
                            <p>商品の写真を撮影</p>
                        </div>
                    )}
                </div>
                
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />
                
                {/* Developer-only default image button */}
                {!generatedText && !imageFile && (
                    <div className="dev-controls">
                        <button 
                            className="dev-default-button"
                            onClick={handleUseDefaultImage}
                            title="開発者用：デフォルト画像を使用"
                        >
                            🔧 デフォルト画像
                        </button>
                    </div>
                )}
                
                {imageFile && !generatedText && (
                    <button 
                        className="generate-button"
                        onClick={generateDescriptionFromImage}
                        disabled={isGenerating}
                    >
                        {isGenerating ? '生成中...' : '商品説明文を生成'}
                    </button>
                )}
                
                {generatedText && (
                    <div className="product-description-container">
                        <h3 className="product-description-header">商品説明</h3>
                        <div className="generated-text">
                            {generatedText}
                        </div>
                        {showStartButton && (
                            <button 
                                className="start-edit-button"
                                onClick={handleStartEditing}
                            >
                                編集開始
                            </button>
                        )}
                    </div>
                )}
                
                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default ProductImageUploadPhase;
