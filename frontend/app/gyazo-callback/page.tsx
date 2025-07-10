'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';

const GyazoCallbackPage = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [message, setMessage] = useState('Gyazoアカウントを連携しています...');

    useEffect(() => {
        // 認証情報の読み込みが完了するまで待機
        if (loading) {
            return;
        }

        // ログインしていない場合はエラーとしてホームページにリダイレクト
        if (!user) {
            setMessage("エラー: ログインしていません。ホームページに戻ります。");
            setTimeout(() => router.push('/?error=not_logged_in_for_gyazo'), 3000);
            return;
        }

        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (accessToken) {
            // ユーザーのドキュメントにトークンを保存
            const gyazoDocRef = doc(db, 'users', user.uid, 'integrations', 'gyazo');
            setDoc(gyazoDocRef, { accessToken: accessToken, createdAt: new Date() })
                .then(() => {
                    setMessage("連携が完了しました。");
                    // 成功後、ホームページにリダイレクト
                    router.push('/');
                })
                .catch((error) => {
                    console.error("Failed to save Gyazo token:", error);
                    setMessage("エラー: トークンの保存に失敗しました。");
                    router.push('/?error=gyazo_token_save_failed');
                });
        } else {
            // トークンが見つからない場合もエラー
            setMessage("エラー: Gyazoから有効なトークンが取得できませんでした。");
            router.push('/?error=gyazo_no_token_found');
        }
    }, [user, loading, router]);

    return (
        <div className="loading-container" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>{message}</p>
        </div>
    );
};

export default GyazoCallbackPage; 