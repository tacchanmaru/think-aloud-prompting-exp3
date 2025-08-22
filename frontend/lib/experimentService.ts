import { ExperimentResult } from './types';

export async function saveExperimentData(data: ExperimentResult): Promise<boolean> {
    try {
        const response = await fetch('/api/save-experiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }
            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Experiment data saved successfully:', result);
        return true;

    } catch (error) {
        console.error('Error saving experiment data:', error);
        return false;
    }
}


// メールIDを決定する関数（archiveと同様の方式）
export function getEmailIdForUser(userId: string, experimentType: 'manual' | 'think-aloud' | 'text-prompting'): string {
    // ユーザーIDから数値を生成
    const hashCode = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const userIndex = Math.abs(hashCode) % 4;
    
    // Manual: email1, email2を使用
    // Think-Aloud: email2, email1を使用（異なるメールでバランス化）
    // Text-Prompting: email2, email1を使用
    if (experimentType === 'manual') {
        return userIndex < 2 ? 'email1' : 'email2';
    } else {
        return userIndex < 2 ? 'email2' : 'email1'; // Think-AloudとText-Promptingは逆にする
    }
}

// 実験時間を計算する関数
export function calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.floor((end - start) / 1000);
}