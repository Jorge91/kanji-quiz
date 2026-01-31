import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { KanjiEntry, KanjiProgress, UserStats, QuizResult, KanjiSet } from '../types';

interface KanjiDB extends DBSchema {
    customKanji: {
        key: string;
        value: KanjiEntry;
        indexes: { 'by-set': string };
    };
    customSets: {
        key: string;
        value: KanjiSet;
    };
    progress: {
        key: string;
        value: KanjiProgress;
    };
    stats: {
        key: string;
        value: UserStats;
    };
    quizHistory: {
        key: number;
        value: QuizResult;
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'kanji-app-db';
const DB_VERSION = 2; // Incremented version

let dbPromise: Promise<IDBPDatabase<KanjiDB>>;

export const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<KanjiDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
                if (!db.objectStoreNames.contains('customKanji')) {
                    const store = db.createObjectStore('customKanji', { keyPath: 'id' });
                    store.createIndex('by-set', 'setId');
                } else if (oldVersion < 2) {
                    // Migration for existing data if needed, or simple index addition
                    const store = transaction.objectStore('customKanji');
                    if (!store.indexNames.contains('by-set')) {
                        store.createIndex('by-set', 'setId');
                    }
                }

                if (!db.objectStoreNames.contains('customSets')) {
                    db.createObjectStore('customSets', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'kanjiId' });
                }
                if (!db.objectStoreNames.contains('stats')) {
                    db.createObjectStore('stats', { keyPath: 'key' }); // Singleton, key='main'
                }
                if (!db.objectStoreNames.contains('quizHistory')) {
                    const store = db.createObjectStore('quizHistory', { autoIncrement: true });
                    store.createIndex('by-date', 'date');
                }
            },
        });
    }
    return dbPromise;
};

// --- Custom Sets Operations ---

export const addCustomSet = async (set: KanjiSet) => {
    const db = await getDB();
    return db.put('customSets', set);
};

export const getCustomSets = async (): Promise<KanjiSet[]> => {
    const db = await getDB();
    return db.getAll('customSets');
};

export const deleteCustomSet = async (id: string) => {
    const db = await getDB();
    // Also delete all kanji in this set? Ideally yes, but keeping it simple for now or cascade manually in UI.
    return db.delete('customSets', id);
};

// --- Custom Kanji Operations ---

export const addCustomKanji = async (kanji: KanjiEntry) => {
    const db = await getDB();
    return db.put('customKanji', kanji);
};

export const getCustomKanji = async (): Promise<KanjiEntry[]> => {
    const db = await getDB();
    return db.getAll('customKanji');
};

export const deleteCustomKanji = async (id: string) => {
    const db = await getDB();
    return db.delete('customKanji', id);
};

// --- Progress/SRS Operations ---

export const getProgress = async (kanjiId: string): Promise<KanjiProgress | undefined> => {
    const db = await getDB();
    return db.get('progress', kanjiId);
};

export const getAllProgress = async (): Promise<KanjiProgress[]> => {
    const db = await getDB();
    return db.getAll('progress');
};

export const updateProgress = async (progress: KanjiProgress) => {
    const db = await getDB();
    return db.put('progress', progress);
};

// --- User Stats Operations ---

const DEFAULT_STATS: UserStats = {
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
};

export const getUserStats = async (): Promise<UserStats> => {
    const db = await getDB();
    const stats = await db.get('stats', 'main');
    return stats || DEFAULT_STATS;
};

export const updateUserStats = async (stats: UserStats) => {
    const db = await getDB();
    // Ensure we keep the 'main' key for the singleton
    return db.put('stats', stats, 'main');
};

export const saveQuizResult = async (result: QuizResult) => {
    const db = await getDB();
    return db.add('quizHistory', result);
};
