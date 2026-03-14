import { useEffect, useRef } from 'react';
import { useVerbQuiz } from '../hooks/useVerbQuiz';
import { useVerbs } from '../hooks/useVerbs';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { I18N } from '../i18n/es';
import { renderFurigana, getTeReading } from '../utils/japanese';

const VerbQuiz = () => {
    const { verbList, loading: dataLoading } = useVerbs();
    const { state, startQuiz, submitAnswer, nextQuestion } = useVerbQuiz(verbList);
    const navigate = useNavigate();

    // Haptics
    const { triggerSuccess, triggerError, triggerSelection } = useHaptics();

    // Swipe State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    // Start quiz once data is ready
    useEffect(() => {
        if (!dataLoading && state.status === 'IDLE' && verbList.length > 0) {
            startQuiz();
        }
    }, [dataLoading, state.status, verbList, startQuiz]);

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
        if (state.status === 'FEEDBACK' && distance > 50) {
            triggerSelection();
            nextQuestion();
        }
    };

    const handleAnswer = (option: string) => {
        if (state.status !== 'QUESTION') return;

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

    const questionText = currentQuestion.mode === 'DICT_TO_TE' ? I18N.verbQuizQuestionTe : I18N.verbQuizQuestionDict;
    const promptVerb = currentQuestion.mode === 'DICT_TO_TE' ? currentQuestion.verb.dictionary_form : currentQuestion.verb.te_form;

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
                <div className="card animate-slide-in" style={{ textAlign: 'center', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem', padding: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>{questionText}</p>
                    <h1 style={{ fontSize: '3.5rem', margin: 0, lineHeight: 1.2 }}>{renderFurigana(promptVerb, currentQuestion.promptReading)}</h1>
                    <p style={{ marginTop: '0.5rem', fontSize: '1.25rem' }}>({currentQuestion.verb.meaning})</p>
                </div>
            )}

            {/* Detailed Info Card - Only shown in Feedback */}
            {isFeedback && (
                <div className={`card ${state.isCorrect ? '' : 'animate-shake'}`} style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{I18N.verbMeaning}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize' }}>{currentQuestion.verb.meaning}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{I18N.dictionaryForm}</div>
                            <div style={{ fontSize: '1.25rem' }}>{renderFurigana(currentQuestion.verb.dictionary_form, currentQuestion.verb.reading)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>{I18N.teForm}</div>
                            <div style={{ fontSize: '1.25rem' }}>{renderFurigana(currentQuestion.verb.te_form, getTeReading(currentQuestion.verb.reading, currentQuestion.verb.group as 1|2|3))}</div>
                        </div>
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
                            style={{ minHeight: '48px', fontSize: '1.25rem', marginBottom: 0, textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                            onClick={() => handleAnswer(option)}
                        >
                            {renderFurigana(option, currentQuestion.optionReadings[idx])}
                        </button>
                    ))}
                </div>
            )}

            {/* Feedback Footer */}
            {isFeedback && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'var(--bg-secondary)',
                    borderTop: `4px solid ${state.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                    padding: '1rem 1.5rem',
                    zIndex: 200,
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
                            className="btn"
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

export default VerbQuiz;
