import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Settings, RefreshCw, Zap } from 'lucide-react';
import { playSound } from '../lib/sounds';

export type AppErrorType = 'QUOTA' | 'OVERLOAD' | 'SUCCESS' | 'GENERAL' | null;

interface Props {
    type: AppErrorType;
    onClose: () => void;
    onOpenSettings: () => void;
    onAction?: () => void;
}

const CONFIG = {
    QUOTA: {
        icon: <Zap size={32} className="text-yellow-400" />,
        glow: 'shadow-[0_0_40px_rgba(234,179,8,0.25)]',
        border: 'border-yellow-600/40',
        badge: 'bg-yellow-500/15 border-yellow-600/40 text-yellow-400',
        badgeText: 'API QUOTA EXCEEDED',
        title: 'Rate Limit Reached',
        desc: 'Your current API key has hit its usage limit. Add a new key or switch to a different provider to continue.',
        tip: '💡 Gemini free tier resets every minute. You can also try HuggingFace or OpenRouter for unlimited access.',
    },
    OVERLOAD: {
        icon: <AlertTriangle size={32} className="text-orange-400" />,
        glow: 'shadow-[0_0_40px_rgba(251,146,60,0.2)]',
        border: 'border-orange-600/40',
        badge: 'bg-orange-500/15 border-orange-600/40 text-orange-400',
        badgeText: 'MODEL OVERLOADED',
        title: 'High Traffic — Model Busy',
        desc: 'This model is currently experiencing heavy demand. Try again in a moment, or switch to a different model or API provider.',
        tip: '💡 Try OpenRouter (routes to fastest available) or switch to a less popular model in Settings.',
    },
    SUCCESS: {
        icon: <Zap size={32} className="text-emerald-400" />,
        glow: 'shadow-[0_0_40px_rgba(16,185,129,0.25)]',
        border: 'border-emerald-600/40',
        badge: 'bg-emerald-500/15 border-emerald-600/40 text-emerald-400',
        badgeText: 'NEURAL FIX APPLIED',
        title: 'Mission Success',
        desc: 'The AI has successfully completed the neural refactor. Your code is now optimized and error-free.',
        tip: '💡 Click "View Fixed Code" below to see the complete rewritten version instantly.',
    },
    GENERAL: {
        icon: <Zap size={32} className="text-[#0ff]" />,
        glow: 'shadow-[0_0_40px_rgba(0,255,255,0.2)]',
        border: 'border-[#0ff]/40',
        badge: 'bg-[#0ff]/15 border-[#0ff]/40 text-[#0ff]',
        badgeText: 'SYSTEM NOTIFICATION',
        title: 'Neural Update',
        desc: 'An update has been processed. Check the latest results for details.',
        tip: '💡 Explore the various features like Review, Refactor, and Generate for best results.',
    },
};

export default function ErrorPopup({ type, onClose, onOpenSettings, onAction }: Props) {
    useEffect(() => {
        if (type) playSound('popup');
    }, [type]);

    if (!type) return null;
    const cfg = (CONFIG as any)[type];

    return (
        <AnimatePresence>
            {type && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/75 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 32 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 32 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        className={`relative w-full max-w-md rounded-2xl bg-[#0d0d1a] border ${cfg.border} ${cfg.glow} overflow-hidden`}
                    >
                        {/* Top accent bar */}
                        <div className={`h-1 w-full ${type === 'QUOTA' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            type === 'SUCCESS' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                type === 'GENERAL' ? 'bg-gradient-to-r from-[#0ff] to-[#5a32fa]' :
                                    'bg-gradient-to-r from-orange-500 to-red-500'
                            }`} />

                        <div className="p-6">
                            {/* Close */}
                            <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
                                <X size={18} />
                            </button>

                            {/* Icon + Badge */}
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className={`w-16 h-16 rounded-2xl ${type === 'QUOTA' ? 'bg-yellow-900/30' :
                                    type === 'SUCCESS' ? 'bg-emerald-900/30' :
                                        type === 'GENERAL' ? 'bg-blue-900/30' :
                                            'bg-orange-900/30'
                                    } flex items-center justify-center mb-4`}>
                                    {cfg.icon}
                                </div>
                                <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full border ${cfg.badge} mb-3`}>
                                    {cfg.badgeText}
                                </span>
                                <h2 className="text-white text-xl font-bold mb-2">{cfg.title}</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">{cfg.desc}</p>
                            </div>

                            {/* Tip box */}
                            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 mb-5">
                                <p className="text-xs text-gray-500 leading-relaxed font-medium italic">{cfg.tip}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                {type === 'SUCCESS' && (
                                    <button
                                        onClick={() => { onAction?.(); onClose(); }}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all border border-emerald-400/20"
                                    >
                                        <Zap size={14} fill="currentColor" /> See Fixed Code
                                    </button>
                                )}

                                <div className="flex gap-3">
                                    {(type === 'QUOTA' || type === 'OVERLOAD') ? (
                                        <>
                                            <button
                                                onClick={() => { onOpenSettings(); onClose(); }}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#5a32fa] to-[#b026ff] text-white font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(176,38,255,0.3)]"
                                            >
                                                <Settings size={16} /> Change API Key
                                            </button>
                                            <button
                                                onClick={onClose}
                                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1a1a2e] border border-gray-800 text-gray-300 font-bold text-sm hover:border-gray-600 hover:text-white transition-all"
                                            >
                                                <RefreshCw size={15} /> Retry
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={onClose}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-xl bg-black/40 border border-white/5 text-gray-300 hover:text-white hover:bg-black/60`}
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
