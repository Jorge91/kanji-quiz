import { useEffect, useState } from 'react';
import { useStats } from '../hooks/useStats';
import { getAllProgress } from '../services/db';
import type { KanjiProgress } from '../types';
import { I18N } from '../i18n/es';

const Stats = () => {
    const { stats } = useStats();
    const [progressList, setProgressList] = useState<KanjiProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await getAllProgress();
            data.sort((a, b) => b.incorrectCount - a.incorrectCount);
            setProgressList(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const totalLearned = progressList.filter(p => p.correctCount > 0).length;

    return (
        <div>
            <h2 style={{ marginBottom: '1rem' }}>{I18N.stats}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{I18N.totalReviews}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalQuestionsAnswered || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{I18N.bestStreak}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.bestStreak || 0}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{I18N.itemsSeen}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalLearned}</div>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{I18N.accuracy}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {stats && stats.totalQuestionsAnswered > 0
                            ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)
                            : 0}%
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>{I18N.reviewPriority}</h3>
            {loading ? (
                <p>{I18N.loading}</p>
            ) : progressList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>{I18N.noData}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {progressList.slice(0, 5).map(p => (
                        <div key={p.kanjiId} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{I18N.id}: {p.kanjiId}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {I18N.streak}: {p.streak}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{p.incorrectCount} {I18N.miss}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{p.correctCount} {I18N.ok}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Stats;
