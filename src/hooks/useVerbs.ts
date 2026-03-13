import { useState, useEffect, useCallback } from 'react';
import type { VerbEntry } from '../types';

export const useVerbs = () => {
    const [verbList, setVerbList] = useState<VerbEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const baseUrl = import.meta.env.BASE_URL;
            const res = await fetch(`${baseUrl}data/verbs.json`);

            if (!res.ok) {
                throw new Error('Failed to load static verbs data');
            }

            const data: VerbEntry[] = await res.json();
            setVerbList(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load verbs data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { verbList, loading, error, refresh: loadData };
};
