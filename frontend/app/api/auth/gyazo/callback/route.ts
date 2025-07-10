import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        // ユーザーが認証を拒否した場合など
        return NextResponse.redirect(new URL('/?error=gyazo_auth_failed', request.url));
    }

    const clientId = process.env.GYAZO_CLIENT_ID;
    const clientSecret = process.env.GYAZO_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gyazo/callback`;

    try {
        // 受け取ったコードをアクセストークンに交換
        const response = await axios.post('https://api.gyazo.com/oauth/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code,
                grant_type: 'authorization_code',
            },
        });

        const accessToken = response.data.access_token;

        // トークンをハッシュとしてフロントエンドのコールバックページに渡す
        const frontendCallbackUrl = new URL('/gyazo-callback', request.url);
        frontendCallbackUrl.hash = `access_token=${accessToken}`;

        return NextResponse.redirect(frontendCallbackUrl);

    } catch (error: unknown) {
        console.error('Gyazo token exchange failed:');
        if (axios.isAxiosError(error)) {
            console.error('Error response:', error.response?.data);
        } else {
            console.error(error);
        }
        return NextResponse.redirect(new URL('/?error=gyazo_token_exchange_failed', request.url));
    }
} 