import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playSound } from '../lib/sounds';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: Props) {
    useEffect(() => {
        if (isOpen) playSound('popup');
    }, [isOpen]);
    const { user, updateUserName } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError('');

        try {
            await updateUserName(name.trim());
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

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
                    className="relative w-full max-w-sm bg-[#0d0d18] border border-[#0ff]/20 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-br from-[#0ff]/10 to-[#5a32fa]/10 p-6 flex flex-col items-center border-b border-white/5">
                        <div className="w-20 h-20 rounded-full border-2 border-[#0ff] p-1 mb-4 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                            <img
                                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0D0D18&color=00FFFF`}
                                className="w-full h-full rounded-full object-cover"
                                alt="Profile"
                            />
                        </div>
                        <h3 className="text-white font-bold text-lg">Your Profile</h3>
                        <p className="text-gray-500 text-xs tracking-widest uppercase font-black">{user?.email}</p>
                    </div>

                    <form onSubmit={handleUpdate} className="p-6 space-y-4">
                        {error && <p className="text-red-400 text-[10px] text-center">{error}</p>}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2">
                                <Sparkles size={12} className="text-[#0ff]" /> Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all placeholder:text-gray-700 font-medium"
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button" onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit" disabled={loading || success}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0ff] to-[#5a32fa] text-white font-bold text-sm shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <Check size={18} className="text-white" /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
