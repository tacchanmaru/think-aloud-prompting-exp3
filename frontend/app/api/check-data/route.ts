import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin初期化
if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const collectionType = searchParams.get('type') || 'task'; // 'task' or 'practice'
        
        if (!userId) {
            return NextResponse.json(
                { error: 'userId parameter is required' },
                { status: 400 }
            );
        }

        const db = getFirestore();
        const docRef = db.doc(`experiments/exp-1/${collectionType}/${userId}`);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return NextResponse.json({
                exists: false,
                message: `No data found for user ${userId} in ${collectionType} collection`
            });
        }

        const data = doc.data();
        
        return NextResponse.json({
            exists: true,
            userId: userId,
            collectionType: collectionType,
            data: data,
            hasManualResult: !!data?.baseline_manual_result,
            hasThinkAloudResult: !!data?.think_aloud_result,
            lastUpdated: data?.lastUpdated,
            message: `Data found for user ${userId}`
        });

    } catch (error) {
        console.error('Error checking Firestore data:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to check Firestore data',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

// 全データを取得するためのエンドポイント（開発/テスト用）
export async function POST(request: NextRequest) {
    try {
        const { collectionType = 'task', limit = 10 } = await request.json();
        
        const db = getFirestore();
        const collectionRef = db.collection(`experiments/exp-1/${collectionType}`);
        const snapshot = await collectionRef.limit(limit).get();
        
        const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            hasManualResult: !!doc.data()?.baseline_manual_result,
            hasThinkAloudResult: !!doc.data()?.think_aloud_result,
        }));
        
        return NextResponse.json({
            success: true,
            collectionType: collectionType,
            totalDocuments: documents.length,
            documents: documents,
        });

    } catch (error) {
        console.error('Error fetching collection data:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to fetch collection data',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}