import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useKanji } from '../hooks/useKanji';
import { useAudio } from '../hooks/useAudio';
import { Volume2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { I18N } from '../i18n/es';

const Study = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { kanjiList, loading } = useKanji();
    const { speak } = useAudio();

    // Parse sets
    const setsParam = searchParams.get('sets');

    // Filtered List
    const studyList = useMemo(() => {
        if (!setsParam || kanjiList.length === 0) return [];
        const filterSets = new Set(setsParam.split(','));
        return kanjiList.filter(k => filterSets.has(k.setId));
    }, [kanjiList, setsParam]);

    // Current Index State with Persistence
    const [index, setIndex] = useState(0);

    const storageKey = `study-index-${setsParam || 'all'}`;

    // Load saved index on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < studyList.length) {
                setIndex(parsed);
            }
        }
    }, [storageKey, studyList.length]);

    // Save index on change
    useEffect(() => {
        localStorage.setItem(storageKey, index.toString());
    }, [index, storageKey]);

    const handleNext = () => {
        setIndex(prev => Math.min(prev + 1, studyList.length - 1));
    };

    const handlePrev = () => {
        setIndex(prev => Math.max(prev - 1, 0));
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [studyList.length]); // Dependencies needed for bounds check in handleNext/Prev if they weren't functional updates, but since they use prev state, only length strictly matters? functional update handles prev. Actually handleNext reference might be stale? No, it's defined inside component. Functional updates inside setIndex are safe. The useEffect needs to be fresh or handleNext needs to be stable. Since handleNext is re-created every render, we can just depend on it, or better yet, put logic inside effect or use useCallback. Simplest is binding effect to [handleNext, handlePrev].
    // Wait, since handleNext/Prev use functional updates, they don't depend on 'index'. They depend on `studyList.length`.



    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>{I18N.loading}</div>;

    if (studyList.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>{I18N.noData}</p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>{I18N.backHome}</button>
            </div>
        );
    }

    const currentKanji = studyList[index];

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-icon" style={{ padding: '0.5rem' }}>
                    <X size={24} />
                </button>
                <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {index + 1} / {studyList.length}
                </div>
                <div style={{ width: '40px' }} /> {/* Spacer */}
            </div>

            {/* Kanji Card */}
            <div className="card animate-slide-in" key={currentKanji.id} style={{ padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div style={{ fontSize: '6rem', fontWeight: 'bold', lineHeight: 1, marginBottom: '0.5rem' }}>
                        {currentKanji.kanji}
                    </div>
                    <button className="btn-icon" onClick={() => speak(currentKanji.readings[0])} style={{ margin: '0 auto' }}>
                        <Volume2 size={32} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.meanings}</h3>
                        <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                            {currentKanji.meanings.join(', ')}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.readings}</h3>
                        <div style={{ fontSize: '1.25rem' }}>
                            {currentKanji.readings.join('、 ')}
                        </div>
                    </div>

                    {currentKanji.examples && currentKanji.examples.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.examples}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {currentKanji.examples.map((ex, i) => (
                                    <div key={i} style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{ex.japanese}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ex.spanish}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                zIndex: 10
            }}>
                <button
                    className="btn btn-secondary"
                    onClick={handlePrev}
                    disabled={index === 0}
                    style={{ width: 'auto', flex: 1, marginBottom: 0 }}
                >
                    <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} /> Anterior
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={index === studyList.length - 1}
                    style={{ width: 'auto', flex: 2, marginBottom: 0 }}
                >
                    Siguiente <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
            <div style={{ height: '80px' }} />
        </div>
    );
};

export default Study;
