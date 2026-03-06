import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Key, Save, ExternalLink,
    Edit3, Trash, Plus, Copy, Check, Eye, EyeOff, Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSound } from '../lib/sounds';

// Logo Imports
import geminiLogo from '../assets/gemini.png';
import openaiLogo from '../assets/openai.png';
import hfLogo from '../assets/huggingface.png';
import orLogo from '../assets/openrouter.png';

interface ApiKey {
    id: string;
    provider: string;
    key: string;
    label: string;
    customModel?: string;
    customEndpoint?: string;
    active: boolean;
}

const PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', icon: geminiLogo, link: 'https://aistudio.google.com/app/apikey' },
    { id: 'openai', name: 'OpenAI', icon: openaiLogo, link: 'https://platform.openai.com/api-keys' },
    { id: 'grok', name: 'xAI Grok', icon: '𝕏', link: 'https://console.x.ai/' },
    { id: 'huggingface', name: 'Hugging Face', icon: hfLogo, link: 'https://huggingface.co/settings/tokens' },
    { id: 'openrouter', name: 'OpenRouter', icon: orLogo, link: 'https://openrouter.ai/keys' },
    { id: 'custom', name: 'Custom API', icon: '🔧', link: '#' },
];

interface Props {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
    const { user, apiKeys, syncApiKeys } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>(apiKeys);
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [label, setLabel] = useState('');
    const [customModel, setCustomModel] = useState('');
    const [customEndpoint, setCustomEndpoint] = useState('');

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const [mobileDetailId, setMobileDetailId] = useState<string | null>(null);

    const activeKey = keys.find(k => k.active);
    const activeProvider = PROVIDERS.find(p => p.id === activeKey?.provider);
    const activeModelName = activeKey?.provider === 'custom' || activeKey?.customModel ? (activeKey.customModel || 'Model') : activeProvider?.name;

    useEffect(() => {
        playSound('popup');
    }, []);

    // Sync local state with context keys
    useEffect(() => {
        setKeys(apiKeys);
    }, [apiKeys]);

    const persistKeys = async (newKeys: ApiKey[]) => {
        await syncApiKeys(newKeys);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        let newKeys: ApiKey[];
        if (editingId) {
            newKeys = keys.map(k => k.id === editingId ? { ...k, provider, key: apiKey, label: label || provider, customModel, customEndpoint } : k);
        } else {
            const newKey: ApiKey = {
                id: Math.random().toString(36).substring(7),
                provider, key: apiKey, label: label || provider, customModel, customEndpoint, active: keys.length === 0
            };
            newKeys = [...keys, newKey];
        }

        await persistKeys(newKeys);
        resetForm();
    };

    const deleteKey = async (id: string) => {
        const newKeys = keys.filter(k => k.id !== id);
        await persistKeys(newKeys);
    };

    const toggleActive = async (id: string) => {
        const newKeys = keys.map(k => ({ ...k, active: k.id === id }));
        await persistKeys(newKeys);
    };

    const copyKey = (text: string, id: string) => {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }).catch(() => {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopiedId(id);
                    setTimeout(() => setCopiedId(null), 2000);
                } catch (err) { console.error('Fallback copy failed', err); }
                document.body.removeChild(textArea);
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (err) { console.error('Direct fallback copy failed', err); }
            document.body.removeChild(textArea);
        }
    };

    const toggleReveal = (id: string) => {
        const next = new Set(revealedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setRevealedIds(next);
    };

    const resetForm = () => {
        setProvider('gemini'); setApiKey(''); setLabel(''); setEditingId(null);
        setCustomModel(''); setCustomEndpoint(''); setViewMode('list');
    };

    const startEdit = (k: ApiKey) => {
        setEditingId(k.id); setProvider(k.provider); setApiKey(k.key);
        setLabel(k.label); setCustomModel(k.customModel || '');
        setCustomEndpoint(k.customEndpoint || ''); setViewMode('edit');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 overflow-y-auto cyber-scrollbar">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[92dvh] bg-[#0d0d18] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto"
                >

                    {/* Sidebar / List (Desktop Only) */}
                    <div className="md:w-72 border-r border-white/5 hidden md:flex flex-col bg-white/[0.02] shrink-0">
                        <div className="p-5 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <Key className="text-[#0ff]" size={18} />
                                <span className="text-white font-bold text-sm tracking-tight">API Key Manager</span>
                            </div>
                            {user && (
                                <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-black uppercase tracking-widest pl-6 animate-pulse">
                                    <Cloud size={10} /> {activeModelName ? `${activeModelName} Api Synced` : 'Cloud Synced'}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto cyber-scrollbar">
                            <button onClick={() => { setViewMode('edit'); setMobileDetailId(null); }} className="w-full py-3 rounded-xl bg-[#0ff]/10 border border-[#0ff]/20 text-[#0ff] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0ff]/20 transition-all mb-2">
                                <Plus size={14} /> Add New Key
                            </button>

                            <div className="space-y-1">
                                <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest px-2 mb-2 italic">Select Active Key</div>
                                {keys.map(k => {
                                    const p = PROVIDERS.find(p => p.id === k.provider);
                                    return (
                                        <button
                                            key={k.id}
                                            onClick={() => {
                                                if (window.innerWidth < 768) {
                                                    setMobileDetailId(k.id);
                                                    setViewMode('list');
                                                } else {
                                                    toggleActive(k.id);
                                                }
                                            }}
                                            className={`w-full text-left group relative p-3 rounded-xl border transition-all ${k.active ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-white/3 border-white/5 hover:bg-white/5'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden bg-black/20">
                                                    {(p?.icon as string).startsWith('data') || (p?.icon as string).includes('.png') ? (
                                                        <img src={p?.icon as string} alt="" className="w-4 h-4 object-contain" />
                                                    ) : (
                                                        <span className="text-xs opacity-80 font-bold text-white">{p?.icon}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-white font-bold text-xs truncate uppercase tracking-tight italic">{k.label}</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5 opacity-60">
                                                            {k.provider === 'custom' ? k.customModel || 'Custom' : p?.name}
                                                        </div>
                                                        {k.active && <span className="text-[8px] text-emerald-400 font-black uppercase tracking-tight opacity-100">● IN USE</span>}
                                                    </div>
                                                </div>
                                                {k.active && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-3">
                                    {(mobileDetailId || viewMode === 'edit') && (
                                        <button
                                            onClick={() => { setMobileDetailId(null); setViewMode('list'); }}
                                            className="md:hidden p-1 px-3 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <div className="text-[11px] md:text-xs font-black tracking-widest text-[#0ff] uppercase italic truncate">
                                        {viewMode === 'list' ? (mobileDetailId ? 'Credential Details' : 'API Key Manager') : editingId ? 'Update Configuration' : 'New Configuration'}
                                    </div>
                                </div>
                                {user && !mobileDetailId && viewMode === 'list' && (
                                    <div className="md:hidden flex items-center gap-1.5 text-[8px] text-emerald-400 font-black uppercase tracking-widest mt-1 opacity-70">
                                        <Cloud size={8} /> {activeModelName ? `${activeModelName} Synced` : 'Synced'}
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"><X size={18} /></button>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto cyber-scrollbar">
                            {viewMode === 'list' ? (
                                <div className="space-y-4">
                                    {keys.length === 0 && viewMode === 'list' ? (
                                        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center mb-4 text-gray-600 border border-white/5">
                                                <Key size={32} />
                                            </div>
                                            <h3 className="text-white font-bold mb-1 italic uppercase tracking-tight">No Keys Found</h3>
                                            <p className="text-gray-500 text-xs italic">Add your first provider key to begin analyzing code.</p>
                                            <button onClick={() => setViewMode('edit')} className="mt-6 px-6 py-3 rounded-xl bg-[#0ff]/10 border border-[#0ff]/30 text-[#0ff] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0ff]/20 transition-all">Create First Key</button>
                                        </div>
                                    ) : (
                                        (window.innerWidth < 768 && !mobileDetailId && viewMode === 'list') ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                <button onClick={() => setViewMode('edit')} className="w-full py-4 rounded-2xl bg-[#0ff]/5 border border-[#0ff]/20 text-[#0ff] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0ff]/10 transition-all mb-2 shadow-lg">
                                                    <Plus size={16} /> Add New API Key
                                                </button>

                                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-1 italic">Active Credentials</div>

                                                {keys.map(k => {
                                                    const p = PROVIDERS.find(p => p.id === k.provider);
                                                    return (
                                                        <button
                                                            key={k.id} onClick={() => setMobileDetailId(k.id)}
                                                            className={`p-5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${k.active ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/3 border-white/5'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
                                                                    {p && ((p.icon as string).startsWith('data') || (p.icon as string).includes('.png')) ? (
                                                                        <img src={p.icon as string} alt="" className="w-6 h-6 object-contain" />
                                                                    ) : (
                                                                        <Key size={20} className={k.active ? 'text-emerald-400' : 'text-gray-600'} />
                                                                    )}
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-white font-bold text-xs uppercase italic tracking-tight">{k.label}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] text-gray-500 uppercase font-black">{p?.name || k.provider}</span>
                                                                        {k.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                                                <Plus size={14} className="text-gray-400" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            (mobileDetailId ? keys.filter(k => k.id === mobileDetailId) : keys).map(k => {
                                                const p = PROVIDERS.find(p => p.id === k.provider);
                                                return (
                                                    <div
                                                        key={k.id}
                                                        className={`glass-panel p-5 rounded-2xl border flex flex-col md:flex-row md:items-center gap-6 group transition-all ${k.active ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-white/10'}`}
                                                    >
                                                        <div className="flex gap-2">
                                                            {k.active ? (
                                                                <span className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest italic border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                                                                    <Check size={12} /> In Use
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => toggleActive(k.id)}
                                                                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 active:scale-95 transition-all shadow-lg"
                                                                >
                                                                    Use
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden bg-black/40 border border-white/5">
                                                                    {(p?.icon as string).startsWith('data') || (p?.icon as string).includes('.png') ? (
                                                                        <img src={p?.icon as string} alt="" className="w-3 h-3 object-contain" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-white">{p?.icon}</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-[#0ff] italic">{p?.name}</span>
                                                                <span className="text-[10px] text-gray-600">•</span>
                                                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{k.label}</span>
                                                                {k.active && (
                                                                    <span className="ml-2 text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                                        <Check size={8} /> {activeModelName} Api Synced
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 font-mono text-sm text-gray-400 bg-black/40 px-3 py-2 rounded-lg border border-white/5 truncate flex items-center justify-between">
                                                                    <span>{revealedIds.has(k.id) ? k.key : '••••••••••••••••'}</span>
                                                                    <button onClick={() => toggleReveal(k.id)} className="ml-2 hover:text-[#0ff] transition-colors">{revealedIds.has(k.id) ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                                                </div>
                                                                <button
                                                                    onClick={() => copyKey(k.key, k.id)}
                                                                    className="p-2 hover:bg-[#0ff]/10 rounded-lg text-gray-500 hover:text-[#0ff] transition-all relative"
                                                                >
                                                                    {copiedId === k.id ? <Check size={16} className="text-[#0ff]" /> : <Copy size={16} />}
                                                                    {copiedId === k.id && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0ff] text-black text-[10px] font-black px-2 py-1 rounded">COPIED</span>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => startEdit(k)} className="p-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-indigo-400 border border-white/5 hover:border-indigo-500/20 transition-all"><Edit3 size={16} /></button>
                                                            <button onClick={() => deleteKey(k.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 border border-white/5 hover:border-red-500/20 transition-all"><Trash size={16} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSave} className="space-y-6 max-w-xl mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest text-[#0ff] uppercase italic flex justify-between items-center">
                                            Select Provider
                                            <a href={PROVIDERS.find(p => p.id === provider)?.link} target="_blank" className="flex items-center gap-1 text-[9px] hover:text-white transition-colors"><ExternalLink size={10} /> Get Key From Source</a>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {PROVIDERS.map(p => (
                                                <button key={p.id} type="button" onClick={() => setProvider(p.id)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1.5 ${provider === p.id ? 'bg-[#0ff]/10 border-[#0ff]/40 text-[#0ff]' : 'bg-white/2 border-white/5 text-gray-600 hover:bg-white/5'}`}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 mb-1 overflow-hidden">
                                                        {(p.icon as string).startsWith('data') || (p.icon as string).includes('.png') || (p.icon as string).includes('static') ? (
                                                            <img src={p.icon as string} alt="" className="w-5 h-5 object-contain" />
                                                        ) : (
                                                            <span className="text-xl">{p.icon}</span>
                                                        )}
                                                    </div>
                                                    {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">Friendly Label</label>
                                            <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all italic" placeholder="e.g. My Personal Gemini" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">API Secret Key</label>
                                            <input type="password" required value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all" placeholder="sk-..." />
                                        </div>
                                        {(provider === 'custom' || provider === 'huggingface' || provider === 'openrouter') && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">Model ID</label>
                                                    <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono" placeholder="e.g. claude-3" />
                                                </div>
                                                {provider === 'custom' && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase italic">Endpoint</label>
                                                        <input type="text" value={customEndpoint} onChange={e => setCustomEndpoint(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono italic" placeholder="https://api..." />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#5a32fa] to-[#b026ff] text-white font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 italic">
                                            <Save size={16} /> {editingId ? 'Update key config' : 'Save API Key'}
                                        </button>
                                        <button type="button" onClick={resetForm} className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-[11px] uppercase hover:bg-white/10 hover:text-white transition-all italic">Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
