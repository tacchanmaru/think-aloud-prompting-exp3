import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioBlob = formData.get('audio');

        if (!audioBlob || !(audioBlob instanceof Blob)) {
            return NextResponse.json({ error: 'Audio blob not found in form data' }, { status: 400 });
        }

        // OpenAI SDKはファイル名を持つFileオブジェクトを期待するため、BlobからFileを生成します。
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm; codecs=opus" });


        const openai = getOpenAIClient();
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'gpt-4o-transcribe',
            language: 'ja',
        });

        return NextResponse.json({ transcript: transcription.text });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        if (error instanceof OpenAI.APIError) {
            return NextResponse.json({ error: error.message, details: error.error }, { status: error.status });
        }
        return NextResponse.json({ error: 'An unknown error occurred during transcription.' }, { status: 500 });
    }
} 