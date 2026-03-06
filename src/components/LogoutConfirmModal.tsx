import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { playSound } from '../lib/sounds';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: Props) {
    useEffect(() => {
        if (isOpen) playSound('popup');
    }, [isOpen]);
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    className="relative w-full max-w-sm bg-[#0d0d18] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                            <LogOut className="text-red-500" size={28} />
                        </div>

                        <h3 className="text-white text-lg font-bold mb-2">Confirm Logout</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Are you sure you want to sign out? Your unsaved API keys will remain only on this browser.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:brightness-110 active:scale-95 transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
