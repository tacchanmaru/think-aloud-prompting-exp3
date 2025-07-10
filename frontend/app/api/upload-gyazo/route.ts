import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(request: Request) {
    try {
        const requestData = await request.formData();
        const image = requestData.get('image') as Blob | null;
        const accessToken = requestData.get('accessToken') as string | null;

        if (!image) {
            return NextResponse.json(
                { error: 'No image data received.' },
                { status: 400 }
            );
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: 'No access token provided.' },
                { status: 401 }
            );
        }

        // Blobをサーバーサイドで扱いやすいBufferに変換します
        const imageBuffer = Buffer.from(await image.arrayBuffer());

        const formData = new FormData();

        // Gyazo APIのドキュメントに従い、access_tokenをフォームフィールドとして送信します
        formData.append('access_token', accessToken);

        // imagedataをBufferとして追加し、必須のfilenameを指定します
        formData.append('imagedata', imageBuffer, {
            filename: 'photo.jpg', // Gyazo APIではファイル名が必須です
            contentType: image.type,
        });

        const response = await axios.post(
            'https://upload.gyazo.com/api/upload',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
            }
        );

        // APIは 'url' フィールドで画像のURLを返します
        return NextResponse.json({ url: response.data.url });

    } catch (error: unknown) {
        let errorMessage = 'Failed to upload image to Gyazo.';
        if (axios.isAxiosError(error)) {
            console.error(
                'Error uploading to Gyazo:',
                error.response?.data || error.message
            );
            errorMessage = error.response?.data?.message || errorMessage;
        } else {
            console.error('An unexpected error occurred:', error);
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
} 