import { useState, useCallback } from 'react';
import type { KanjiEntry, KanjiProgress } from '../types';
import { updateSRS, selectQuizItems } from '../services/srs';
import { getAllProgress, saveQuizResult, updateUserStats, getUserStats } from '../services/db';

type QuizMode = 'KANJI_TO_MEANING' | 'MEANING_TO_KANJI';

interface Question {
    kanji: KanjiEntry;
    options: string[]; // Distractors + Correct Answer mixed
    correctAnswer: string;
    mode: QuizMode;
}

type QuizState =
    | { status: 'IDLE' }
    | { status: 'LOADING' }
    | { status: 'QUESTION'; questionIndex: number; total: number; currentQuestion: Question; score: number; streak: number }
    | { status: 'FEEDBACK'; questionIndex: number; total: number; currentQuestion: Question; selectedAnswer: string; isCorrect: boolean; correctAnswer: string; score: number; streak: number }
    | { status: 'SUMMARY'; score: number; total: number; accuracy: number };

const QUESTIONS_PER_QUIZ = 10;

export const useQuiz = (allKanji: KanjiEntry[]) => {
    const [state, setState] = useState<QuizState>({ status: 'IDLE' });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

    const generateQuestions = useCallback(async (selectedKanji: KanjiEntry[], fullPool: KanjiEntry[]) => {
        return selectedKanji.map(k => {
            const mode: QuizMode = Math.random() > 0.5 ? 'KANJI_TO_MEANING' : 'MEANING_TO_KANJI';
            let options: string[] = [];
            let correctAnswer = '';

            if (mode === 'KANJI_TO_MEANING') {
                correctAnswer = k.meanings[0]; // Simplified: take first meaning
                // Pick 3 random distractors from fullPool
                const distractors = fullPool
                    .filter(item => item.id !== k.id)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3)
                    .map(item => item.meanings[0]);
                options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
            } else {
                correctAnswer = k.kanji;
                const distractors = fullPool
                    .filter(item => item.id !== k.id)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3)
                    .map(item => item.kanji);
                options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
            }

            return {
                kanji: k,
                options,
                correctAnswer,
                mode
            };
        });
    }, []);

    const startQuiz = useCallback(async (filterSetIds?: Set<string>) => {
        if (allKanji.length === 0) return;

        setState({ status: 'LOADING' });

        // Filter pool based on selected sets
        const pool = filterSetIds && filterSetIds.size > 0
            ? allKanji.filter(k => filterSetIds.has(k.setId))
            : allKanji;

        if (pool.length === 0) {
            console.warn("No kanji found for selected sets");
            setState({ status: 'IDLE' });
            return;
        }

        // 1. Fetch SRS Progress
        const progressList = await getAllProgress();
        const progressMap = new Map<string, KanjiProgress>();
        progressList.forEach(p => progressMap.set(p.kanjiId, p));

        // 2. Select Items
        const selectedItems = await selectQuizItems(pool, QUESTIONS_PER_QUIZ, progressMap);

        // 3. Generate Questions
        const quizQuestions = await generateQuestions(selectedItems, pool);

        setQuestions(quizQuestions);
        setSessionStats({ correct: 0, incorrect: 0 });

        // Transition to first question
        setState({
            status: 'QUESTION',
            questionIndex: 0,
            total: quizQuestions.length,
            currentQuestion: quizQuestions[0],
            score: 0,
            streak: 0
        });
    }, [allKanji, generateQuestions]);

    const submitAnswer = useCallback(async (answer: string) => {
        if (state.status !== 'QUESTION') return;

        const isCorrect = answer === state.currentQuestion.correctAnswer;

        // Update SRS in background
        updateSRS(state.currentQuestion.kanji.id, isCorrect);

        // Update session stats
        setSessionStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            incorrect: prev.incorrect + (isCorrect ? 0 : 1)
        }));

        setState(prev => {
            if (prev.status !== 'QUESTION') return prev;
            const newScore = isCorrect ? prev.score + 1 : prev.score;
            const newStreak = isCorrect ? prev.streak + 1 : 0;
            return {
                status: 'FEEDBACK',
                questionIndex: prev.questionIndex,
                total: prev.total,
                currentQuestion: prev.currentQuestion,
                selectedAnswer: answer,
                isCorrect,
                correctAnswer: prev.currentQuestion.correctAnswer,
                score: newScore,
                streak: newStreak
            };
        });

    }, [state]);

    const nextQuestion = useCallback(async () => {
        if (state.status !== 'FEEDBACK') return;

        const nextIndex = state.questionIndex + 1;

        if (nextIndex >= questions.length || nextIndex >= state.total) {
            // Quiz Finished
            const finalScore = state.score;
            const total = state.total;

            try {
                // Persist Stats
                const userStats = await getUserStats();
                userStats.totalQuestionsAnswered += total;
                userStats.correctAnswers = (userStats.correctAnswers || 0) + finalScore;

                if (state.streak > userStats.bestStreak) {
                    userStats.bestStreak = state.streak;
                }
                userStats.currentStreak = state.streak;

                await updateUserStats(userStats);

                await saveQuizResult({
                    totalQuestions: total,
                    correctAnswers: finalScore,
                    date: Date.now()
                });
            } catch (error) {
                console.error("Failed to save quiz stats:", error);
                // Continue to summary anyway
            }

            setState({
                status: 'SUMMARY',
                score: finalScore,
                total,
                accuracy: total > 0 ? (finalScore / total) * 100 : 0
            });
        } else {
            setState({
                status: 'QUESTION',
                questionIndex: nextIndex,
                total: state.total,
                currentQuestion: questions[nextIndex],
                score: state.score,
                streak: state.streak
            });
        }
    }, [state, questions, sessionStats]);

    return {
        state,
        startQuiz,
        submitAnswer,
        nextQuestion,
        reset: () => setState({ status: 'IDLE' })
    };
};
