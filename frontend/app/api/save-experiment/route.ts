import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ExperimentResult } from '../../../lib/types';

// Firebase Admin初期化
if (!getApps().length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error('Missing Firebase Admin environment variables');
        }
        
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        // 環境変数のデバッグ情報
        console.log('Environment variables check:', {
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) + '...'
        });

        const experimentData: ExperimentResult = await request.json();
        
        // 必須フィールドのバリデーション
        if (!experimentData.userId || !experimentData.experimentType || !experimentData.productId) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, experimentType, or productId' },
                { status: 400 }
            );
        }

        const db = getFirestore();
        
        // コレクションパスの決定
        const collectionPath = experimentData.isPracticeMode ? 'practice' : 'task';
        const docRef = db.doc(`experiments/exp-1/${collectionPath}/${experimentData.userId}`);
        
        // 実験タイプに応じたフィールド名の決定
        const fieldName = experimentData.experimentType === 'manual' 
            ? 'baseline_manual_result' 
            : 'think_aloud_result';

        // Firestoreに保存
        const updateData = {
            [fieldName]: {
                ...experimentData,
                savedAt: new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
        };

        await docRef.set(updateData, { merge: true });

        console.log(`Experiment data saved for user ${experimentData.userId}, type: ${experimentData.experimentType}`);

        return NextResponse.json({ 
            success: true,
            message: 'Experiment data saved successfully',
            userId: experimentData.userId,
            experimentType: experimentData.experimentType,
        });

    } catch (error) {
        console.error('Error saving experiment data:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        return NextResponse.json(
            { 
                error: 'Failed to save experiment data',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}