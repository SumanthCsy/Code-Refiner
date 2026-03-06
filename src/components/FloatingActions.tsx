import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, HelpCircle, ChevronRight, Zap } from 'lucide-react';
import { toggleMute, getMuteState } from '../lib/sounds';

interface Props {
    onOpenHelp: () => void;
}

export default function FloatingActions({ onOpenHelp }: Props) {
    const [muted, setMuted] = useState(getMuteState());
    const [expanded, setExpanded] = useState(false);

    const handleToggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = toggleMute();
        setMuted(newState);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-2 sm:gap-3">
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="flex flex-col gap-2 sm:gap-3"
                    >
                        {/* Audio Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleToggleMute}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#0d0d18] border border-[#b026ff]/30 shadow-2xl flex items-center justify-center text-[#b026ff] hover:bg-[#b026ff]/10 hover:border-[#b026ff] transition-all"
                            title={muted ? "Unmute Audio" : "Mute Audio"}
                        >
                            <div className="sm:hidden">{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</div>
                            <div className="hidden sm:block">{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</div>
                        </motion.button>

                        {/* Help Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { onOpenHelp(); setExpanded(false); }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#0d0d18] border border-[#0ff]/30 shadow-2xl flex items-center justify-center text-[#0ff] hover:bg-[#0ff]/10 hover:border-[#0ff] transition-all"
                            title="Platform Guide"
                        >
                            <HelpCircle className="sm:hidden" size={18} />
                            <HelpCircle className="hidden sm:block" size={20} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpanded(!expanded)}
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#0d0d18] border shadow-2xl flex items-center justify-center transition-all ${expanded
                    ? 'border-white/20 text-white rotate-90'
                    : 'border-[#0ff]/30 text-[#0ff] hover:border-[#0ff]'
                    }`}
            >
                {expanded ? (
                    <>
                        <ChevronRight className="sm:hidden" size={22} />
                        <ChevronRight className="hidden sm:block" size={28} />
                    </>
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], filter: ["drop-shadow(0 0 0px #0ff)", "drop-shadow(0 0 8px #0ff)", "drop-shadow(0 0 0px #0ff)"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Zap className="sm:hidden" size={22} fill="currentColor" />
                        <Zap className="hidden sm:block" size={28} fill="currentColor" />
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
