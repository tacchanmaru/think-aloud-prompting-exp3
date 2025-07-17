import { NextRequest, NextResponse } from 'next/server';

// Types for text modification (matching archive backend types)
interface TextModificationRequest {
    text: string;
    utterance: string;
    imageBase64?: string;
    history?: TextModificationHistory[];
    historySummary?: string;
}

interface TextModificationHistory {
    utterance: string;
    editPlan: string;
    originalText: string;
    modifiedText: string;
}

interface JsonModificationCommand {
    line: number;
    command: 'add' | 'delete' | 'modify';
    text: string;
}

interface GPTResponse {
    should_edit: 'yes' | 'no';
    plan: string;
    content: JsonModificationCommand[];
}

// GPT prompt matching archive backend combined_judge_plan_modify.py
function createGPTPrompt(
    numberedText: string, 
    utterance: string, 
    historySummary: string,
    history: TextModificationHistory[]
): any[] {
    const historyContext = historySummary ? `\n\n現在の編集における制約条件:\n${historySummary}` : '';
    
    // Format recent history (last 3 items)
    let historyText = '';
    if (history && history.length > 0) {
        const recentHistory = history.slice(-3);
        historyText = '編集履歴:\n' + recentHistory.map(h => 
            `- 元文章: ${h.originalText}\n  発話: ${h.utterance}\n  計画: ${h.editPlan}\n  修正後: ${h.modifiedText}\n`
        ).join('\n');
    }

    return [
        {
            role: 'system',
            content: `あなたはフリマアプリの商品説明文を改善するAIアシスタントです。

ユーザーが提供する元の商品説明文と、それに関する感想を含む発話に基づいて、以下の処理を一度に行ってください：

## ステップ1: 修正が必要かの判断
その発話が商品説明文に対するフィードバックを含んでいるかを判断してください。
- 具体的な変更指示だけでなく、「読みづらい」「情報が足りない」などのフィードバックの場合でも、修正を検討します。
- 咳払いや意味のない言葉、関係のない話題など、明らかにフィードバックでないものの場合は、修正は不要です。
- 商品説明文をそのまま読んでいるだけの場合なども想定されますが、その場合は修正は不要です。
- 「元に戻して」系の発話の場合も修正を検討します。

## ステップ2: 修正指示の生成（修正が必要な場合のみ）
修正が必要と判断した場合は、以下の方針で具体的な修正指示を生成してください：
- ユーザーから特段指示がない限りは、文章のスタイル（箇条書き、文体など）は基本的に維持する
- 制約条件が提示されている場合は、それらを考慮してバランスの取れた修正を提案する
- 「元に戻して」系の発話の場合は、履歴から適切な過去の状態や特徴を特定して復元する
- 必要最小限の修正のみを行い、変更不要な行には言及しない
- フリマアプリの商品説明として適切な表現を心がける
- 画像の内容と説明文の整合性を確認する
- 一度の変更で文章を長くし過ぎたり、短くしすぎたりすると、ユーザーが読むのが辛くなってしまうので、修正は控えめでお願いします。

## 出力形式
以下のJSON形式で出力してください：

{
    "should_edit": "no" または "yes",
    "plan": "修正方針の説明（ユーザーが直感的に確認しやすいようになるべく短くシンプルに）",
    "content": [
        {
            "line": 行番号（数値）,
            "command": "add" | "delete" | "modify",
            "text": "追加・変更する内容（deleteの場合は空文字列）"
        }
    ]
}

should_editが"no"の場合はplanは空文字列、contentは空配列にしてください。
should_editが"yes"の場合は修正方針をplanに、修正指示をcontentに配列で含めてください。
                       
addは行番号の次に追加します。

## 注意点
- JSON形式のみを返してください。説明や理由は含めないでください
- 個人が出品する一点物の商品の説明文章なので、他の商品が存在することを前提とした表現や説明になることはありません
- 文章として読みやすいようにスタイルには特に気をつけてください
1. 箇条書きの中に急に文章が入り込んだり、空行が変なところに入り込んだりしないように注意してください
2. 特に箇条書きに変更する際や、箇条書きを追加する際などは、空行が変なところに挟まれたり、順番がおかしくならないように注意してください
3. 元の文章に変な空行が含まれていたり、順番がおかしい場合なども、ユーザーの発話に関係なく直していいです。
- 重複している項目が無いように注意してください

## 例: 状態項目を箇条書きに追加する場合
入力テキスト:
1: ふわふわの白いイタチのぬいぐるみです。
2: - 種類: イタチのぬいぐるみ
3: - カラー: ホワイト（しっぽは黒）
4: - サイズ: 約20cm
5: 
6: 目立った汚れはありません。
7: ご覧いただきありがとうございます。

ユーザーの発話: 状態も種類などと合わせて箇条書きにして

出力例:
{
    "should_edit": "yes",
    "plan": "状態の情報を箇条書きの項目として追加します。",
    "content": [
        {
            "line": 4,
            "command": "add",
            "text": "- 状態: 目立った汚れや傷はなく、美品です"
        },
        {
            "line": 6,
            "command": "delete",
            "text": ""
        },
    ]
}
                       
目指すテキスト:
1: ふわふわの白いイタチのぬいぐるみです。
2: - 種類: イタチのぬいぐるみ
3: - カラー: ホワイト（しっぽは黒）
4: - サイズ: 約20cm
5: - 状態: 目立った汚れや傷はなく、美品です
6: 
7: ご覧いただきありがとうございます。`
        },
        {
            role: 'user',
            content: [
                { type: 'text', text: `元の商品説明文: ${numberedText}` },
                { type: 'text', text: `ユーザーの発話: ${utterance}` },
                { type: 'text', text: `制約条件: ${historyContext}` },
                ...(historyText ? [{ type: 'text', text: historyText }] : [])
            ]
        }
    ];
}

function addLineNumbers(text: string): string {
    const lines = text.split('\n');
    const numberedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) { // Only add line numbers to non-empty lines
            numberedLines.push(`${i + 1}: ${line}`);
        }
    }
    
    return numberedLines.join('\n');
}

function applyJsonModifications(originalText: string, modifications: JsonModificationCommand[]): string {
    const lines = originalText.split('\n');
    
    // Sort modifications by line number in descending order (apply from bottom to top)
    const sortedModifications = [...modifications].sort((a, b) => b.line - a.line);
    
    for (const mod of sortedModifications) {
        const lineIndex = mod.line - 1; // Convert to 0-indexed
        
        if (mod.command === 'modify') {
            // Replace line
            if (lineIndex >= 0 && lineIndex < lines.length) {
                lines[lineIndex] = mod.text;
            }
        } else if (mod.command === 'add') {
            // Insert after line
            if (lineIndex >= 0 && lineIndex < lines.length) {
                lines.splice(lineIndex + 1, 0, mod.text);
            } else if (lineIndex === lines.length) {
                // Add at the end
                lines.push(mod.text);
            }
        } else if (mod.command === 'delete') {
            // Delete line
            if (lineIndex >= 0 && lineIndex < lines.length) {
                lines.splice(lineIndex, 1);
            }
        }
    }
    
    return lines.join('\n');
}

export async function POST(request: NextRequest) {
    try {
        const body: TextModificationRequest = await request.json();
        const { text, utterance, imageBase64, history = [], historySummary = '' } = body;

        if (!text || !utterance) {
            return NextResponse.json(
                { error: 'text and utterance are required' },
                { status: 400 }
            );
        }

        // Add line numbers to text (matching archive backend)
        const numberedText = addLineNumbers(text);

        // Create GPT prompt
        const messages = createGPTPrompt(numberedText, utterance, historySummary, history);

        // Add image if provided
        if (imageBase64) {
            const userMessage = messages[1] as any;
            userMessage.content.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                }
            });
        }

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-mini',
                messages: messages,
                temperature: 0,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const gptResponse = result.choices[0]?.message?.content;

        if (!gptResponse) {
            throw new Error('No response from GPT');
        }

        // Parse GPT JSON response
        let parsedResponse: GPTResponse;
        try {
            parsedResponse = JSON.parse(gptResponse);
        } catch (parseError) {
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

        // Apply modifications
        if (parsedResponse.should_edit === 'yes' && parsedResponse.content) {
            const modifiedText = applyJsonModifications(text, parsedResponse.content);
            
            return NextResponse.json({
                shouldEdit: true,
                modifiedText,
                plan: parsedResponse.plan,
                editPlan: parsedResponse.plan
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