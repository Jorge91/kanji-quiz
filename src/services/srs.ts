import type { KanjiEntry, KanjiProgress } from '../types';
import { getProgress, updateProgress } from './db';

const REVIEW_INTERVAL_MULTIPLIER = 24 * 60 * 60 * 1000; // 1 day in ms

export const getNextReviewDate = (currentStreak: number): number => {
    // Simple Exponential Backoff: 1 day, 2 days, 4 days, 8 days...
    const days = Math.pow(2, Math.max(0, currentStreak - 1));
    return Date.now() + days * REVIEW_INTERVAL_MULTIPLIER;
};

export const updateSRS = async (kanjiId: string, isCorrect: boolean) => {
    const progress = await getProgress(kanjiId) || {
        kanjiId,
        correctCount: 0,
        incorrectCount: 0,
        lastReviewed: 0,
        nextReview: 0,
        streak: 0,
    };

    progress.lastReviewed = Date.now();

    if (isCorrect) {
        progress.correctCount += 1;
        progress.streak += 1;
        progress.nextReview = getNextReviewDate(progress.streak);
    } else {
        progress.incorrectCount += 1;
        progress.streak = 0; // Reset streak on failure
        progress.nextReview = Date.now(); // Review immediately/soon
    }

    await updateProgress(progress);
    return progress;
};

/**
 * Weighted Random Selection for Quiz
 * Prioritizes:
 * 1. Overdue Items (nextReview <= now)
 * 2. Items with high failure rates
 * 3. Random new items
 */
export const selectQuizItems = async (
    allKanji: KanjiEntry[],
    count: number = 10,
    progressMap: Map<string, KanjiProgress>
): Promise<KanjiEntry[]> => {
    const now = Date.now();
    const candidates = allKanji.map(k => {
        const p = progressMap.get(k.id);
        let weight = 1;

        if (p) {
            if (p.nextReview <= now) weight += 10; // Overdue
            if (p.streak === 0 && p.incorrectCount > 0) weight += 5; // Recently failed
        } else {
            weight += 2; // New item boost
        }
        return { kanji: k, weight };
    });

    // Shuffle and Pick Weighted
    // For simplicity here, we'll just sort by weight + random noise
    candidates.sort((a, b) => (b.weight + Math.random() * 5) - (a.weight + Math.random() * 5));

    return candidates.slice(0, count).map(c => c.kanji);
};
