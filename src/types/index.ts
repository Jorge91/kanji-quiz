export interface KanjiSet {
    id: string;
    title: string;
    isCustom: boolean;
}

export interface KanjiEntry {
    id: string;
    kanji: string;
    readings: string[]; // Kana only
    meanings: string[]; // Spanish
    setId: string; // 'n5', 'n4', or custom set ID
    examples?: { japanese: string; spanish: string }[];
}

export interface KanjiProgress {
    kanjiId: string;
    correctCount: number;
    incorrectCount: number;
    lastReviewed: number; // Timestamp
    nextReview: number; // Timestamp (SRS)
    streak: number;
}

export interface QuizResult {
    totalQuestions: number;
    correctAnswers: number;
    date: number;
}

export interface UserStats {
    totalQuestionsAnswered: number;
    correctAnswers: number;
    currentStreak: number;
    bestStreak: number;
}
