import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Create ephemeral token for transcription session
        const response = await fetch('https://api.openai.com/v1/realtime/transcription_sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Empty body as per Zenn article
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create ephemeral token:', response.status, errorText);
            return NextResponse.json(
                { error: 'Failed to create ephemeral token', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Ephemeral token created successfully');

        // Return the ephemeral token value
        return NextResponse.json({
            token: data.client_secret.value
        });

    } catch (error) {
        console.error('Error creating ephemeral token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 