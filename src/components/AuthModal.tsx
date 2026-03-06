import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import appLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { playSound } from '../lib/sounds';

type AuthMode = 'login' | 'signup' | 'forgot';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
    const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) playSound('popup');
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
                onClose();
            } else if (mode === 'signup') {
                if (!name.trim()) throw new Error("Name is required");
                await signupWithEmail(email, password, name);
                onClose();
            } else {
                await resetPassword(email);
                setSuccess('Check your email for reset instructions!');
                setTimeout(() => setMode('login'), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
            onClose();
        } catch (err: any) {
            setError(err.message || "Google login failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#0d0d18] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-[#5a32fa]/20 to-[#b026ff]/20">
                        <div className="absolute inset-0 cyber-grid-small opacity-20" />
                        <div className="relative z-10 text-center -mt-4">
                            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                <img src={appLogo} alt="Code Refiner" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">
                                {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Recover Access'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center font-medium">
                                {success}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    <input
                                        type="text" required value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all placeholder:text-gray-700"
                                        placeholder="Your Name"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <input
                                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all placeholder:text-gray-700"
                                    placeholder="name@example.com"
                                />
                            </div>

                            {mode !== 'forgot' && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2">
                                            <Lock size={12} /> Password
                                        </label>
                                        {mode === 'login' && (
                                            <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-bold text-[#0ff]/70 hover:text-[#0ff] transition-all">
                                                Forgot?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-white/3 border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white text-sm focus:outline-none focus:border-[#0ff]/50 transition-all placeholder:text-gray-700"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button" onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-gray-300 transition-all"
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#5a32fa] to-[#b026ff] text-white font-bold text-sm shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin text-white" /> : (
                                    mode === 'login' ? 'Sign In Now' : mode === 'signup' ? 'Create Account' : 'Send Recovery Email'
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <div className="relative flex justify-center text-[10px]"><span className="bg-[#0d0d18] px-3 font-black tracking-tighter text-gray-600 uppercase">Secure Gateway</span></div>
                        </div>

                        <button
                            onClick={handleGoogle} disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-xs hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                            Continue with Google
                        </button>

                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-500">
                                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className="ml-2 text-[#0ff] font-bold hover:underline"
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
