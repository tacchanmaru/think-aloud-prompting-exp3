// 基本的な実験データの型
export interface BaseExperimentData {
    userId: number;        // 1-100の範囲のユーザーID
    experimentType: 'manual' | 'think-aloud' | 'text-prompting';
    productId: string;
    originalText: string;
    finalText: string;
    startTime: string; // ISO形式
    endTime: string;   // ISO形式
    durationSeconds: number;
    isPracticeMode?: boolean;
}

// Manual実験の結果
export interface ManualExperimentResult extends BaseExperimentData {
    experimentType: 'manual';
}

// Think-Aloud実験の中間ステップ
export interface IntermediateStep {
    utterance: string;           // ユーザーの発話内容
    past_utterances: string;     // ユーザーの過去の発話
    edit_plan: string;           // AIによる修正提案・計画
    modified_text: string;       // AIによって修正されたテキスト
    history_summary?: string;    // その時点での制約や履歴の要約
}

// Think-Aloud実験の結果
export interface ThinkAloudExperimentResult extends BaseExperimentData {
    experimentType: 'think-aloud';
    intermediateSteps: IntermediateStep[];
}

// Text-Prompting実験の結果
export interface TextPromptingExperimentResult extends BaseExperimentData {
    experimentType: 'text-prompting';
    intermediateSteps: IntermediateStep[];
}

// 実験結果の統合型
export type ExperimentResult = ManualExperimentResult | ThinkAloudExperimentResult | TextPromptingExperimentResult;