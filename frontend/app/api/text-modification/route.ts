import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Types for email reply modification
interface TextModificationRequest {
    text: string;  // 現在の返信文
    utterance: string;
    pastUtterances?: string;  // 過去のユーザーの入力（「、」で区切られた文字列）
    originalEmail?: string;  // 受信したメール内容
    emailSubject?: string;   // メールの件名
    history?: TextModificationHistory[];
    historySummary?: string;
}

interface TextModificationHistory {
    utterance: string;
    editPlan: string;
    originalText: string;
    modifiedText: string;
}

interface GPTResponse {
    should_edit: 'yes' | 'no';
    plan: string;
    content: string;  // 修正後の文章全体
}

// GPT prompt for email reply modification
function createGPTPrompt(
    text: string, 
    utterance: string, 
    pastUtterances: string,
    historySummary: string,
    history: TextModificationHistory[],
    originalEmail?: string,
    emailSubject?: string
): any[] {
    
    // Format recent history (last 3 items)
    let historyText = '';
    if (history && history.length > 0) {
        const recentHistory = history.slice(-3);
        historyText = '編集履歴:\n' + recentHistory.map(h => 
            `- 元文章: ${h.originalText}\n  ユーザーの入力: ${h.utterance}\n  計画: ${h.editPlan}\n  修正後: ${h.modifiedText}\n`
        ).join('\n');
    }

    return [
        {
            role: 'system',
            content: `あなたはメールの返信文を改善するAIアシスタントです。

現在の返信文と、それに関するユーザーの入力に基づいて、以下の処理を一度に行ってください：

## ステップ1: 修正が必要かの判断
ユーザーの入力が返信文に対するフィードバックを含んでいるかを判断してください。
- 具体的な変更指示だけでなく、「読みづらい」「丁寧すぎる」「もっと親しみやすく」などのフィードバックの場合でも、修正を検討する
- ユーザーの入力が「元に戻して」等の場合も修正を検討する
- 咳払いや意味のない言葉、関係のない話題、返信文をそのまま再掲しているだけなど、明らかにフィードバックでないものの場合は、修正は行わない

## ステップ2: 修正文章の生成（修正が必要な場合のみ）
修正が必要と判断した場合は、以下の方針で修正後の文章全体を生成してください。
- これまでの編集傾向は、現在のユーザーの入力と矛盾しない範囲で考慮する
- ユーザーから特段指示がない限りは、文章のスタイル（敬語レベル、文体など）は基本的に維持する
- ユーザーの入力が「元に戻して」系の場合は、履歴から適切な過去の状態や特徴を特定して復元する
- 受信したメールの内容に適切に対応する返信文として自然な表現を心がける
- 一度の変更で文章を長くし過ぎたり、短くしすぎたりすると、ユーザーが読むのが辛くなってしまうので、修正は控えめにする
- ビジネスメールとして適切な礼儀とマナーを保つ

## 出力形式
以下のJSON形式で出力してください。
{
    "should_edit": "no" または "yes",
    "plan": "修正方針の説明（ユーザーが直感的に確認しやすいようになるべく短くシンプルに）",
    "content": "修正後の返信文全体（説明や理由は含めない）"
}

## 注意点
- 過去のユーザーの入力と現在のユーザーの入力が続いている場合があるので、文脈を考慮して解釈する
- JSON形式のみを返す
- メールの返信として適切な形式と内容を保つ
- 文章として読みやすいようにスタイルには特に気をつける`
        },
        {
            role: 'user',
            content: [
                { type: 'text', text: `現在の返信文: ${text || '（まだ返信文が入力されていません）'}` },
                { type: 'text', text: `ユーザーの現在の入力: ${utterance}` },
                ...(pastUtterances ? [{ type: 'text', text: `ユーザーの過去の入力: ${pastUtterances}` }] : []),
                ...(historySummary ? [{ type: 'text', text: `これまでの編集傾向:\n${historySummary}` }] : []),
                ...(historyText ? [{ type: 'text', text: historyText }] : []),
                ...(originalEmail ? [{ type: 'text', text: `受信したメール内容:\n${originalEmail}` }] : []),
                ...(emailSubject ? [{ type: 'text', text: `メールの件名: ${emailSubject}` }] : [])
            ]
        }
    ];
}


export async function POST(request: NextRequest) {
    try {
        const body: TextModificationRequest = await request.json();
        const { text, utterance, pastUtterances = '', originalEmail, emailSubject, history = [], historySummary = '' } = body;

        if (!utterance) {
            return NextResponse.json(
                { error: 'utterance is required' },
                { status: 400 }
            );
        }

        // Create GPT messages
        const messages = createGPTPrompt(text, utterance, pastUtterances, historySummary, history, originalEmail, emailSubject);

        // Call OpenAI API
        const result = await client.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: messages,
            temperature: 0,
        });

        const gptResponse = (result.choices[0]?.message?.content ?? '').trim();

        if (!gptResponse) {
            console.error('response (debug):', result);
            throw new Error('No response from GPT');
        }

        // Parse GPT JSON response
        let parsedResponse: GPTResponse;
        try {
            parsedResponse = JSON.parse(gptResponse);
        } catch {
            console.error('Failed to parse GPT response:', gptResponse);
            return NextResponse.json({
                shouldEdit: false,
                error: 'Failed to parse GPT response'
            });
        }

        // If no edit needed, return early
        if (parsedResponse.should_edit === 'no') {
            return NextResponse.json({
                shouldEdit: false,
                plan: ''
            });
        }

        // Return the modified text
        if (parsedResponse.should_edit === 'yes' && parsedResponse.content) {
            return NextResponse.json({
                shouldEdit: true,
                modifiedText: parsedResponse.content,
                plan: parsedResponse.plan
            });
        }

        return NextResponse.json({
            shouldEdit: false,
            plan: ''
        });

    } catch (error) {
        console.error('Text modification error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process text modification',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}