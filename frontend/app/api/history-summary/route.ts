import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TextModificationHistory {
  utterance: string;
  editPlan: string;
  originalText: string;
  modifiedText: string;
}

export async function POST(request: NextRequest) {
  try {
    const { history, currentSummary = '' }: { history: TextModificationHistory[]; currentSummary?: string } = await request.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ historySummary: '' });
    }

    // archiveのhistory_summarizerの実装に基づいたシステムプロンプト
    const systemPrompt = `あなたはユーザーの編集履歴を分析し、編集の傾向を記録する専門家です。

以下の編集履歴から、ユーザーの編集傾向を抽出してください：

# 記録のルール
1. ユーザーの実際の入力を「」で引用しながら、その意図を簡潔に解釈する
2. 強すぎる一般化は避け、具体的な文脈を含める
3. 最新の指示をより重視する
4. 矛盾する指示がある場合は、その変化も記録する

# 出力形式
最大3-5個の箇条書きで、以下のような形式：
- 「デスマス調をやめて」など 親しみやすい表現を好む
- 「購入場所は箇条書きで」「状態についても」など、詳細情報は箇条書きでの整理を好む
- 「文章詰まってるから直して」のように適度な改行で読みやすさを重視する

各項目は30-40文字程度以内で簡潔に。`;

    // 履歴をテキスト形式に変換
    const historyText = history.map((item, index) => `
## 編集 ${index + 1}
**ユーザー入力**: ${item.utterance}
**編集計画**: ${item.editPlan}
**元テキスト**: ${item.originalText}
**修正後テキスト**: ${item.modifiedText}
`).join('\n');

    const userPrompt = `${currentSummary ? `現在の編集傾向の記録:\n${currentSummary}\n\n` : ''}編集履歴:
${historyText}

上記の履歴から、ユーザーが実際に行った編集指示とその傾向を記録してください。ユーザーの入力内容を「」で引用しながら、簡潔に解釈を加えてください。
${currentSummary ? '既存の記録に新しい傾向を追加したり、矛盾する場合は更新してください。' : ''}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
    });

    const historySummary = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ historySummary });

  } catch (error) {
    console.error('History summary error:', error);
    return NextResponse.json(
      { error: 'History summary generation failed' },
      { status: 500 }
    );
  }
}