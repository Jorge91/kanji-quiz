import { useState, useCallback } from 'react';
import type { VerbEntry } from '../types';
import { saveQuizResult, updateUserStats, getUserStats } from '../services/db';

import { getTeReading, getMasuForm, getMasuReading } from '../utils/japanese';

type QuizMode = 'MASU_TO_TE' | 'MASU_TO_DICT';

export interface VerbQuestion {
    verb: VerbEntry;
    options: string[]; // Distractors + Correct Answer mixed
    optionReadings: string[]; // Readings corresponding to options
    correctAnswer: string;
    promptVerb: string; // The verb shown as prompt (-masu form)
    promptReading: string; // Reading for the prompt verb
    mode: QuizMode;
}

type QuizState =
    | { status: 'IDLE' }
    | { status: 'LOADING' }
    | { status: 'QUESTION'; questionIndex: number; total: number; currentQuestion: VerbQuestion; score: number; streak: number }
    | { status: 'FEEDBACK'; questionIndex: number; total: number; currentQuestion: VerbQuestion; selectedAnswer: string; isCorrect: boolean; correctAnswer: string; score: number; streak: number }
    | { status: 'SUMMARY'; score: number; total: number; accuracy: number };

const QUESTIONS_PER_QUIZ = 10;

export const useVerbQuiz = (allVerbs: VerbEntry[]) => {
    const [state, setState] = useState<QuizState>({ status: 'IDLE' });
    const [questions, setQuestions] = useState<VerbQuestion[]>([]);

    const startQuiz = useCallback(() => {
        if (allVerbs.length === 0) return;

        setState({ status: 'LOADING' });

        // Simple random selection
        const shuffled = [...allVerbs].sort(() => 0.5 - Math.random());
        const selectedItems = shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, allVerbs.length));

        const generatedQuestions = selectedItems.map(verb => {
            const mode: QuizMode = Math.random() > 0.5 ? 'MASU_TO_TE' : 'MASU_TO_DICT';
            let options: string[] = [];
            let optionReadings: string[] = [];
            let correctAnswer = '';
            
            // Prompt is ALWAYS -masu form
            const promptVerb = getMasuForm(verb.dictionary_form, verb.group as 1|2|3);
            const promptReading = getMasuReading(verb.reading, verb.group as 1|2|3);

            if (mode === 'MASU_TO_TE') {
                correctAnswer = verb.te_form;
                
                const chosenDistractors = allVerbs
                    .filter(v => v.verb !== verb.verb && v.te_form !== verb.te_form)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
                
                const allOrients = [...chosenDistractors, verb].sort(() => 0.5 - Math.random());
                options = allOrients.map(v => v.te_form);
                optionReadings = allOrients.map(v => getTeReading(v.reading, v.group as 1|2|3));

            } else {
                correctAnswer = verb.dictionary_form;
                
                const chosenDistractors = allVerbs
                    .filter(v => v.verb !== verb.verb && v.dictionary_form !== verb.dictionary_form)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
                
                const allOrients = [...chosenDistractors, verb].sort(() => 0.5 - Math.random());
                options = allOrients.map(v => v.dictionary_form);
                optionReadings = allOrients.map(v => v.reading);
            }

            return {
                verb,
                options,
                optionReadings,
                correctAnswer,
                promptVerb,
                promptReading,
                mode
            };
        });

        setQuestions(generatedQuestions);

        setState({
            status: 'QUESTION',
            questionIndex: 0,
            total: generatedQuestions.length,
            currentQuestion: generatedQuestions[0],
            score: 0,
            streak: 0
        });
    }, [allVerbs]);

    const submitAnswer = useCallback((answer: string) => {
        if (state.status !== 'QUESTION') return;

        const isCorrect = answer === state.currentQuestion.correctAnswer;

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
    }, [state, questions]);

    return {
        state,
        startQuiz,
        submitAnswer,
        nextQuestion,
        reset: () => setState({ status: 'IDLE' })
    };
};
