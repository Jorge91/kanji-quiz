import { useState, useMemo } from 'react';
import { useKanji } from '../hooks/useKanji';
import { Trash2, Search, CheckSquare, Square, Save } from 'lucide-react';
import { I18N } from '../i18n/es';

const ManageKanji = () => {
    const { kanjiList, sets, createSet, removeSet, loading } = useKanji();

    // Tab state: 'sets', 'creator'
    const [activeTab, setActiveTab] = useState<'sets' | 'creator'>('creator');

    // Creator State
    const [creatorSearch, setCreatorSearch] = useState('');
    const [selectedForSet, setSelectedForSet] = useState<Set<string>>(new Set());
    const [newSetTitle, setNewSetTitle] = useState('');

    // Creator Handlers
    const toggleSelection = (kanjiId: string) => {
        const next = new Set(selectedForSet);
        if (next.has(kanjiId)) next.delete(kanjiId);
        else next.add(kanjiId);
        setSelectedForSet(next);
    };

    const handleCreateSetFromSelection = async () => {
        if (!newSetTitle || selectedForSet.size === 0) return;

        // Find actual entries
        const selectedEntries = kanjiList.filter(k => selectedForSet.has(k.id));

        await createSet(newSetTitle, selectedEntries);

        // Reset
        setNewSetTitle('');
        setSelectedForSet(new Set());
        setActiveTab('sets');
    };

    // Derived Data
    const customSets = sets.filter(s => s.isCustom);

    // Filter for creator (All Kanji)
    const filteredAllKanji = useMemo(() => {
        if (!creatorSearch) return kanjiList;
        const lower = creatorSearch.toLowerCase();
        return kanjiList.filter(k =>
            k.kanji.includes(lower) ||
            k.meanings.some(m => m.toLowerCase().includes(lower)) ||
            k.readings.some(r => r.includes(lower))
        );
    }, [kanjiList, creatorSearch]);

    if (loading) return <div>{I18N.loading}</div>;

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '0.5rem 1rem',
                borderBottom: activeTab === id ? '2px solid var(--accent)' : 'none',
                color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === id ? 'bold' : 'normal',
                background: 'transparent'
            }}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h2 style={{ marginBottom: '1rem' }}>{I18N.manageContent}</h2>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                <TabButton id="creator" label={I18N.createSet} />
                <TabButton id="sets" label={I18N.setsTab} />
            </div>

            {/* TAB: VISUAL CREATOR (Default for Creation) */}
            {activeTab === 'creator' && (
                <div>
                    <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Selecciona los kanjis de la lista y guárdalos como un nuevo set.
                        </p>
                    </div>

                    <div className="card" style={{ position: 'sticky', top: '80px', zIndex: 90 }}>
                        <h3>Constructor Visual</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                value={newSetTitle}
                                onChange={e => setNewSetTitle(e.target.value)}
                                placeholder="Nombre del Set (ej. Verbos)"
                            />
                            <button
                                className="btn btn-primary"
                                style={{ width: 'auto', marginBottom: 0 }}
                                onClick={handleCreateSetFromSelection}
                                disabled={!newSetTitle || selectedForSet.size === 0}
                            >
                                <Save size={20} style={{ marginRight: '0.5rem' }} /> Guardar ({selectedForSet.size})
                            </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                value={creatorSearch}
                                onChange={e => setCreatorSearch(e.target.value)}
                                placeholder="Buscar kanji..."
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                        {filteredAllKanji.map(k => {
                            const isSelected = selectedForSet.has(k.id);
                            return (
                                <div
                                    key={k.id}
                                    onClick={() => toggleSelection(k.id)}
                                    style={{
                                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                        background: isSelected ? 'rgba(88, 204, 2, 0.1)' : 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{k.kanji}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {k.meanings[0]}
                                    </div>
                                    <div style={{ position: 'absolute', top: '4px', right: '4px', color: isSelected ? 'var(--accent)' : 'var(--border)' }}>
                                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: SETS (Management) */}
            {activeTab === 'sets' && (
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Mis Sets Personalizados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {customSets.map(s => (
                            <div key={s.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                                <span style={{ fontWeight: 'bold' }}>{s.title}</span>
                                <button onClick={() => removeSet(s.id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {customSets.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>{I18N.noCustomSets}</p>
                                <button className="btn btn-primary" onClick={() => setActiveTab('creator')}>{I18N.createSet}</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageKanji;
