import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    try {
        console.log('=== Firebase Test API Called ===');
        
        // 環境変数のチェック
        const envCheck = {
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) + '...'
        };

        console.log('Environment variables:', envCheck);

        // Firebase Admin初期化テスト
        if (!getApps().length) {
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
        }

        // Firestore接続テスト
        const db = getFirestore();
        
        return NextResponse.json({ 
            success: true,
            message: 'Firebase Admin is working correctly',
            envCheck,
            appsLength: getApps().length
        });

    } catch (error) {
        console.error('Firebase test error:', error);
        
        return NextResponse.json(
            { 
                error: 'Firebase Admin test failed',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}