import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, TrendingUp, Award, BookOpen } from 'lucide-react';
import { useStats } from '../hooks/useStats';
import { useKanji } from '../hooks/useKanji';
import { I18N } from '../i18n/es';

const STORAGE_KEY_SETS = 'kanji-app-last-sets';

const Dashboard = () => {
    const navigate = useNavigate();
    const { stats } = useStats();
    const { sets, loading } = useKanji();
    const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY_SETS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSelectedSets(new Set(parsed));
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved sets", e);
            }
        }
        setSelectedSets(new Set(['n5']));
    }, []);

    const toggleSet = (id: string) => {
        const newSets = new Set(selectedSets);
        if (newSets.has(id)) {
            newSets.delete(id);
        } else {
            newSets.add(id);
        }
        setSelectedSets(newSets);
    };

    const savePreference = () => {
        localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(Array.from(selectedSets)));
    };

    const handleStartQuiz = () => {
        if (selectedSets.size === 0) return;
        savePreference();
        const param = Array.from(selectedSets).join(',');
        navigate(`/quiz?sets=${param}`);
    };

    const handleStartStudy = () => {
        if (selectedSets.size === 0) return;
        savePreference();
        const param = Array.from(selectedSets).join(',');
        navigate(`/study?sets=${param}`);
    };

    const handleVerbStudy = () => navigate('/verb-study');
    const handleVerbQuiz = () => navigate('/verb-quiz');

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>{I18N.loading}</div>;

    return (
        <div style={{ paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Kanji Section */}
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🇯🇵</h1>
                <h2 style={{ marginBottom: '0.5rem' }}>Kanji</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {I18N.selectLevels}
                </p>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    {sets.map(set => (
                        <button
                            key={set.id}
                            onClick={() => toggleSet(set.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: `2px solid ${selectedSets.has(set.id) ? 'var(--accent)' : 'var(--border)'}`,
                                background: selectedSets.has(set.id) ? 'var(--accent)' : 'var(--bg-primary)',
                                color: selectedSets.has(set.id) ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                            }}
                        >
                            {set.title}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartQuiz}
                        disabled={selectedSets.size === 0}
                        style={{ opacity: selectedSets.size === 0 ? 0.5 : 1, marginBottom: 0, padding: '0.75rem 0.5rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                            <Play size={18} fill="currentColor" /> {I18N.startQuiz}
                        </div>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={handleStartStudy}
                        disabled={selectedSets.size === 0}
                        style={{ opacity: selectedSets.size === 0 ? 0.5 : 1, marginBottom: 0, padding: '0.75rem 0.5rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                            <BookOpen size={18} /> {I18N.studyMode}
                        </div>
                    </button>
                </div>
                {selectedSets.size === 0 && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '1rem' }}>{I18N.selectAtLeastOne}</p>}
            </div>

            {/* Verbs Section */}
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗣️</span> Verbos
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleVerbQuiz}
                        style={{ marginBottom: 0, padding: '0.75rem 0.5rem', background: 'var(--success)', boxShadow: '0 4px 0 #46a302', border: 'none', color: 'white' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                            <Play size={18} fill="currentColor" /> {I18N.verbQuiz}
                        </div>
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={handleVerbStudy}
                        style={{ marginBottom: 0, padding: '0.75rem 0.5rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                            <BookOpen size={18} /> {I18N.studyVerbs}
                        </div>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TrendingUp className="text-accent" size={24} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.currentStreak || 0}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{I18N.streak}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Award size={24} style={{ color: 'var(--warning)', marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalQuestionsAnswered || 0}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{I18N.reviews}</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
