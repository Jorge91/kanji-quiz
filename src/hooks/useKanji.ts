import { useState, useEffect, useCallback } from 'react';
import type { KanjiEntry, KanjiSet } from '../types';
import { getCustomKanji, addCustomKanji, deleteCustomKanji, getCustomSets, addCustomSet, deleteCustomSet } from '../services/db';

const STATIC_SETS: KanjiSet[] = [
    { id: 'n5', title: 'JLPT N5', isCustom: false },
    { id: 'n4', title: 'JLPT N4', isCustom: false },
    { id: 'n3', title: 'JLPT N3', isCustom: false }
];

export const useKanji = () => {
    const [kanjiList, setKanjiList] = useState<KanjiEntry[]>([]);
    const [sets, setSets] = useState<KanjiSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            // Load static data
            const baseUrl = import.meta.env.BASE_URL;
            const [n5Res, n4Res, n3Res] = await Promise.all([
                fetch(`${baseUrl}kanji/n5.json`),
                fetch(`${baseUrl}kanji/n4.json`),
                fetch(`${baseUrl}kanji/n3.json`)
            ]);

            if (!n5Res.ok || !n4Res.ok || !n3Res.ok) {
                throw new Error('Failed to load static kanji data');
            }

            const n5Data: KanjiEntry[] = await n5Res.json();
            const n4Data: KanjiEntry[] = await n4Res.json();
            const n3Data: KanjiEntry[] = await n3Res.json();

            // Inject setIds for static data
            const n5WithId = n5Data.map(k => ({ ...k, setId: 'n5' }));
            const n4WithId = n4Data.map(k => ({ ...k, setId: 'n4' }));
            const n3WithId = n3Data.map(k => ({ ...k, setId: 'n3' }));

            // Load custom data & sets
            const customData = await getCustomKanji();
            // Ensure custom data has setId
            const customDataSafe = customData.map(k => ({ ...k, setId: k.setId || 'custom-default' }));

            const customSets = await getCustomSets();

            setKanjiList([...n5WithId, ...n4WithId, ...n3WithId, ...customDataSafe]);
            setSets([...STATIC_SETS, ...customSets]);

        } catch (err) {
            console.error(err);
            setError('Failed to load kanji data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Kanji Operations
    const addKanji = async (newKanji: Omit<KanjiEntry, 'isCustom'>) => {
        await addCustomKanji(newKanji);
        await loadData();
    };

    const removeKanji = async (id: string) => {
        await deleteCustomKanji(id);
        await loadData();
    };

    // Set Operations
    const createSet = async (title: string, entries: KanjiEntry[] = []) => {
        const newSet: KanjiSet = {
            id: crypto.randomUUID(),
            title,
            isCustom: true
        };
        await addCustomSet(newSet);

        // If entries are provided, add them to customKanji with new setId
        for (const entry of entries) {
            const newEntry = { ...entry, id: crypto.randomUUID(), setId: newSet.id };
            await addCustomKanji(newEntry);
        }

        await loadData();
        return newSet.id;
    };

    const removeSet = async (id: string) => {
        await deleteCustomSet(id);
        // Also remove kanji with this setId??
        // Implementation decision: clean up orphans or keep them?
        // Let's keep it simple: orphans stay but might be hidden if filtered by set. 
        // Better to clean up.
        // For now, simple implementation.
        await loadData();
    };

    return { kanjiList, sets, loading, error, addKanji, removeKanji, createSet, removeSet, refresh: loadData };
};
