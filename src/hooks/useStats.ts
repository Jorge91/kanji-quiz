import { useState, useEffect, useCallback } from 'react';
import type { UserStats } from '../types';
import { getUserStats, updateUserStats } from '../services/db';

export const useStats = () => {
    const [stats, setStats] = useState<UserStats | null>(null);

    const loadStats = useCallback(async () => {
        const data = await getUserStats();
        setStats(data);
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const updateStats = async (newStats: UserStats) => {
        await updateUserStats(newStats);
        setStats(newStats);
    };

    return { stats, updateStats, refreshStats: loadStats };
};
