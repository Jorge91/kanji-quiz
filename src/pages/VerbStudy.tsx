import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVerbs } from '../hooks/useVerbs';
import { useAudio } from '../hooks/useAudio';
import { Volume2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { I18N } from '../i18n/es';

const VerbStudy = () => {
    const navigate = useNavigate();
    const { verbList, loading, error } = useVerbs();
    const { speak } = useAudio();

    // Index State with Persistence
    const [index, setIndex] = useState(0);
    const storageKey = 'verb-study-index';

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed) && parsed >= 0 && verbList.length > 0 && parsed < verbList.length) {
                setIndex(parsed);
            }
        }
    }, [verbList.length]);

    useEffect(() => {
        if (verbList.length > 0) {
            localStorage.setItem(storageKey, index.toString());
        }
    }, [index, verbList.length]);

    const handleNext = () => setIndex(prev => Math.min(prev + 1, verbList.length - 1));
    const handlePrev = () => setIndex(prev => Math.max(prev - 1, 0));

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
    }, [verbList.length]); 

    // Touch State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        if (distance > 50) handleNext();
        else if (distance < -50) handlePrev();
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>{I18N.loading}</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error: {error}</div>;

    if (verbList.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>{I18N.noData}</p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>{I18N.backHome}</button>
            </div>
        );
    }

    const currentVerb = verbList[index];

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn-icon" style={{ padding: '0.5rem' }}>
                    <X size={24} />
                </button>
                <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {index + 1} / {verbList.length}
                </div>
                <div style={{ width: '40px' }} />
            </div>

            {/* Verb Card */}
            <div className="card animate-slide-in" key={currentVerb.verb} style={{ padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', minHeight: '1.5rem' }}>
                        {currentVerb.verb !== currentVerb.reading ? currentVerb.reading : ''}
                    </div>
                    <div style={{ fontSize: '4.5rem', fontWeight: 'bold', lineHeight: 1, marginBottom: '1rem' }}>
                        {currentVerb.verb}
                    </div>
                    <button className="btn-icon" onClick={() => speak(currentVerb.reading)} style={{ margin: '0 auto' }}>
                        <Volume2 size={32} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.verbMeaning}</h3>
                        <div style={{ fontSize: '1.75rem', fontWeight: '600', textTransform: 'capitalize' }}>
                            {currentVerb.meaning}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.verbGroup}</h3>
                        <div style={{ fontSize: '1.25rem', fontWeight: '500' }}>
                            Grupo {currentVerb.group}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.dictionaryForm}</h3>
                        <div style={{ fontSize: '1.5rem' }}>
                            {currentVerb.dictionary_form}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{I18N.teForm}</h3>
                        <div style={{ fontSize: '1.5rem' }}>
                            {currentVerb.te_form}
                        </div>
                    </div>
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
                zIndex: 200
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
                    disabled={index === verbList.length - 1}
                    style={{ width: 'auto', flex: 2, marginBottom: 0 }}
                >
                    Siguiente <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
            <div style={{ height: '80px' }} />
        </div>
    );
};

export default VerbStudy;
