import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { toggleMute, getMuteState } from '../lib/sounds';

export default function AudioControl() {
    const [muted, setMuted] = useState(getMuteState());

    const handleToggle = () => {
        const newState = toggleMute();
        setMuted(newState);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            className="fixed bottom-6 right-24 w-14 h-14 rounded-2xl bg-[#0d0d18] border border-[#b026ff]/30 shadow-[0_0_30px_rgba(176,38,255,0.15)] flex items-center justify-center text-[#b026ff] z-[100] hover:bg-[#b026ff]/10 hover:border-[#b026ff] transition-all"
            title={muted ? "Unmute Audio" : "Mute Audio"}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={muted ? 'muted' : 'unmuted'}
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                >
                    {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
