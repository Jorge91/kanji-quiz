import { useEffect, useRef } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { useKanji } from '../hooks/useKanji';
import { useAudio } from '../hooks/useAudio';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Volume2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { I18N } from '../i18n/es';

const Quiz = () => {
    const { kanjiList, loading: dataLoading } = useKanji();
    const { state, startQuiz, submitAnswer, nextQuestion } = useQuiz(kanjiList);
    const { speak } = useAudio();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Haptics
    const { triggerSuccess, triggerError, triggerSelection } = useHaptics();

    // Swipe State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    // Start quiz once data is ready
    useEffect(() => {
        if (!dataLoading && state.status === 'IDLE' && kanjiList.length > 0) {
            const setsParam = searchParams.get('sets');
            const filterSets = setsParam ? new Set(setsParam.split(',')) : undefined;
            startQuiz(filterSets);
        }
    }, [dataLoading, state.status, kanjiList, startQuiz, searchParams]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (state.status === 'FEEDBACK') {
                    e.preventDefault();
                    triggerSelection();
                    nextQuestion();
                } else if (state.status === 'SUMMARY') {
                    e.preventDefault();
                    triggerSelection();
                    navigate('/');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.status, nextQuestion, navigate, triggerSelection]);

    // Touch Handlers for Swipe
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
        const isLeftSwipe = distance > 50;
        // const isRightSwipe = distance < -50;

        if (state.status === 'FEEDBACK') {
            // Swipe Left to Next Question
            if (isLeftSwipe) {
                triggerSelection();
                nextQuestion();
            }
        }
    };

    const handleAnswer = (option: string) => {
        if (state.status !== 'QUESTION') return;

        // Optimistically calculate correctness for haptics
        const isCorrect = option === state.currentQuestion.correctAnswer;
        if (isCorrect) triggerSuccess();
        else triggerError();

        submitAnswer(option);
    };

    if (dataLoading || state.status === 'LOADING' || state.status === 'IDLE') {
        return <div style={{ display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>Cargando...</div>;
    }

    if (state.status === 'SUMMARY') {
        return (
            <div className="card animate-pop" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>{I18N.quizComplete}</h2>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                    {state.score} / {state.total}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{I18N.accuracy}: {state.accuracy.toFixed(0)}%</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                    <button className="btn btn-primary" onClick={() => { triggerSelection(); startQuiz(); }}>{I18N.newQuiz}</button>
                    <button className="btn btn-secondary" onClick={() => { triggerSelection(); navigate('/'); }}>{I18N.backHome}</button>
                </div>
            </div>
        );
    }

    const { currentQuestion, questionIndex, total, score } = state;
    const isFeedback = state.status === 'FEEDBACK';

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingBottom: '20px', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}
        >
            {/* Header Loop Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                <span>{I18N.question} {questionIndex + 1} / {total}</span>
                <span>{I18N.points}: {score}</span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{
                    width: `${((questionIndex) / total) * 100}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    borderRadius: '4px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
            </div>

            {/* Main Card */}
            {!isFeedback && (
                <div className="card animate-slide-in" style={{ textAlign: 'center', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
                    {currentQuestion.mode === 'KANJI_TO_MEANING' ? (
                        <>
                            <h1 style={{ fontSize: '4.5rem', margin: 0, lineHeight: 1.2 }}>{currentQuestion.kanji.kanji}</h1>
                            <button className="btn-icon" onClick={() => speak(currentQuestion.kanji.readings[0])} style={{ margin: '0.5rem 0 0 0', transform: 'scale(1.1)' }}>
                                <Volume2 size={28} />
                            </button>
                        </>
                    ) : (
                        <h2 style={{ fontSize: '2rem', margin: '1rem 0' }}>{currentQuestion.kanji.meanings.join(', ')}</h2>
                    )}
                </div>
            )}

            {/* Detailed Info Card - Only shown in Feedback */}
            {isFeedback && (
                <div className={`card ${state.isCorrect ? '' : 'animate-shake'}`} style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1 }}>
                            {currentQuestion.kanji.kanji}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <button className="btn-icon" onClick={() => speak(currentQuestion.kanji.readings[0])} style={{ alignSelf: 'flex-start', padding: '0.25rem' }}>
                                <Volume2 size={24} />
                            </button>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                {currentQuestion.kanji.meanings.join(', ')}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>{I18N.readings}</div>
                            <div style={{ fontSize: '1.1rem' }}>{currentQuestion.kanji.readings.join('、 ')}</div>
                        </div>
                        {currentQuestion.kanji.examples && currentQuestion.kanji.examples.length > 0 && (
                            <div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 'bold', letterSpacing: '1px' }}>{I18N.examples}</div>
                                {currentQuestion.kanji.examples.slice(0, 2).map((ex, i) => ( // Show max 2 examples to save space
                                    <div key={i} style={{ marginBottom: '0.4rem', padding: '0.4rem', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{ex.japanese}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ex.spanish}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Options */}
            {!isFeedback && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            className="btn btn-secondary"
                            style={{ minHeight: '48px', fontSize: '1rem', marginBottom: 0, textAlign: 'left', paddingLeft: '1.5rem', paddingRight: '1rem' }}
                            onClick={() => handleAnswer(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}

            {/* Feedback Footer */}
            {isFeedback && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: state.isCorrect ? 'var(--bg-secondary)' : 'var(--bg-secondary)', // Neutral bg, colored border/icon
                    borderTop: `4px solid ${state.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                    padding: '1rem 1.5rem',
                    zIndex: 200, // Above Nav
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                    animation: 'slideInUp 0.3s ease-out'
                }}>
                    <div className="container" style={{ minHeight: 'auto', padding: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {state.isCorrect ? (
                                <div className="animate-pop"><CheckCircle color="var(--success)" size={40} /></div>
                            ) : (
                                <div className="animate-shake"><XCircle color="var(--danger)" size={40} /></div>
                            )}
                            <div>
                                <h3 style={{ margin: 0, color: state.isCorrect ? 'var(--success)' : 'var(--danger)', fontSize: '1.25rem', fontWeight: '800' }}>
                                    {state.isCorrect ? I18N.correct : I18N.incorrect}
                                </h3>
                                {!state.isCorrect && (
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem' }}>
                                        Solución: <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{currentQuestion.correctAnswer}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            className={`btn ${state.isCorrect ? 'btn-primary' : 'btn-danger'}`} // Use danger style matching validation? Actually primary is fine if correct. If error, maybe danger button. But let's stick to primary for "Continue" action.
                            style={{
                                width: 'auto',
                                marginBottom: 0,
                                paddingLeft: '1.5rem',
                                paddingRight: '1.5rem',
                                background: state.isCorrect ? 'var(--success)' : 'var(--danger)',
                                boxShadow: state.isCorrect ? '0 4px 0 #46a302' : '0 4px 0 #d32f2f',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.9rem'
                            }}
                            onClick={() => { triggerSelection(); nextQuestion(); }}
                        >
                            {I18N.continue} <ArrowRight size={18} style={{ marginLeft: '0.5rem', display: 'inline' }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quiz;
