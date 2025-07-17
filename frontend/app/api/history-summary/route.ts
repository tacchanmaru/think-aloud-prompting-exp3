import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
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
    const { history }: { history: TextModificationHistory[] } = await request.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ historySummary: '' });
    }

    // archiveのhistory_summarizerの実装に基づいたシステムプロンプト
    const systemPrompt = `あなたはユーザーの文章編集履歴を分析し、ユーザー固有の書き方の好みや特徴を抽出する専門家です。

以下の編集履歴を分析し、このユーザーの文章作成における個人的な好みや特徴を抽出してください：

# 分析観点
- ユーザーの発言から読み取れる個人的な好み
- 好む表現スタイルや文章パターン
- 重視する情報の種類や詳細度
- 避けたい表現や要素
- 文章構成や体裁の好み
- 最近のフィードバックをより重視する

# 出力形式
ユーザーの特徴を3-5個の簡潔な要点として出力してください。
一般的な文章作成のルールではなく、このユーザー特有の特徴に焦点を当ててください。`;

    // 履歴をテキスト形式に変換
    const historyText = history.map((item, index) => `
## 編集 ${index + 1}
**ユーザー発言**: ${item.utterance}
**編集計画**: ${item.editPlan}
**元テキスト**: ${item.originalText}
**修正後テキスト**: ${item.modifiedText}
`).join('\n');

    const userPrompt = `編集履歴:
${historyText}

上記の編集履歴から、このユーザーの文章作成における個人的な好みや特徴を抽出してください。`;

    const completion = await openai.chat.completions.create({
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