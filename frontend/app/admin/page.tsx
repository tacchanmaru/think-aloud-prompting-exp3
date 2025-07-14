'use client';

import { useState } from 'react';

export default function AdminPage() {
    const [userId, setUserId] = useState('');
    const [collectionType, setCollectionType] = useState('task');
    const [result, setResult] = useState<any>(null);
    const [allData, setAllData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkUserData = async () => {
        if (!userId.trim()) {
            alert('ユーザーIDを入力してください');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/check-data?userId=${encodeURIComponent(userId)}&type=${collectionType}`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            setResult({ error: 'データの取得に失敗しました' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/check-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collectionType: collectionType,
                    limit: 20
                }),
            });
            const data = await response.json();
            setAllData(data);
        } catch (error) {
            console.error('Error:', error);
            setAllData({ error: 'データの取得に失敗しました' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Firestore データ確認</h1>
            
            <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>ユーザーデータ確認</h2>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>コレクションタイプ: </label>
                    <select 
                        value={collectionType} 
                        onChange={(e) => setCollectionType(e.target.value)}
                        style={{ marginLeft: '10px', padding: '5px' }}
                    >
                        <option value="task">本実験 (task)</option>
                        <option value="practice">練習 (practice)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>ユーザーID: </label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="user_1234567890_abcde"
                        style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
                    />
                </div>

                <button 
                    onClick={checkUserData} 
                    disabled={loading}
                    style={{ padding: '10px 20px', marginRight: '10px' }}
                >
                    {loading ? '確認中...' : 'データ確認'}
                </button>

                <button 
                    onClick={fetchAllData} 
                    disabled={loading}
                    style={{ padding: '10px 20px' }}
                >
                    {loading ? '取得中...' : '全データ取得'}
                </button>
            </div>

            {result && (
                <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>ユーザーデータ結果</h3>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            {allData && (
                <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>全データ結果</h3>
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '400px' }}>
                        {JSON.stringify(allData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}