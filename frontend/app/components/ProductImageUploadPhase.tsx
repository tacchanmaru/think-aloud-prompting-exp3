'use client';

import { useState, useRef } from 'react';
import { FaImage } from 'react-icons/fa';

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
            
            const sampleTexts = [
                `ふわふわで可愛いフェレットのぬいぐるみです。手触りがとても良く、お子様への贈り物にも最適です。リビングや寝室のインテリアとしても素敵です。サイズは約20cmで、持ち運びにも便利です。`,
                `高品質な素材を使用したペンです。滑らかな書き心地で、ビジネスシーンでも使いやすいデザインです。重量バランスが良く、長時間の使用でも疲れにくい仕様になっています。`,
                `シンプルで実用的なバッグです。軽量でありながら耐久性に優れ、日常使いに最適です。内側にはポケットが複数あり、小物の整理もしやすくなっています。`,
                `可愛らしいデザインのペンギンのぬいぐるみです。ふわふわの毛質で、触り心地抜群です。お部屋のインテリアや癒しのアイテムとしてもおすすめです。`,
                `上質な素材で作られたバッグです。シンプルなデザインで様々なシーンに合わせやすく、収納力も十分です。丈夫な作りで長くお使いいただけます。`
            ];
            
            const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
            
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
            onComplete(imageFile, imagePreview, generatedText);
        }
    };

    return (
        <div className="upload-phase">
            <div className="upload-card">
                <h2>商品画像を選択</h2>
                <div className="upload-area">
                    {imagePreview ? (
                        <img src={imagePreview} alt="選択された画像" className="preview-image" />
                    ) : (
                        <div className="upload-placeholder">
                            <FaImage />
                            <p>商品の写真を撮影してください</p>
                        </div>
                    )}
                </div>
                
                {!generatedText && (
                    <div className="upload-buttons">
                        <button 
                            className="camera-button-main"
                            onClick={handleTakePhoto}
                        >
                            📸 写真を撮る
                        </button>
                    </div>
                )}
                
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
                    <div className="generated-content">
                        <h3>生成された商品説明</h3>
                        <div className="generated-text">
                            {generatedText}
                        </div>
                        {showStartButton && (
                            <button 
                                className="start-edit-button"
                                onClick={handleStartEditing}
                            >
                                編集を開始する
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
