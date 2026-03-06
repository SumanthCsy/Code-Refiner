import { motion, AnimatePresence } from 'framer-motion';
import {
    X, HelpCircle, Key, Zap, AlertTriangle,
    ArrowRight, MessageSquare, ShieldCheck, Sparkles
} from 'lucide-react';
import { useEffect } from 'react';
import { playSound } from '../lib/sounds';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: Props) {
    useEffect(() => {
        if (isOpen) playSound('popup');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 overflow-y-auto cyber-scrollbar">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[92dvh] bg-[#0d0d18] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#0ff]/5 to-[#5a32fa]/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0ff]/10 border border-[#0ff]/30 flex items-center justify-center">
                                <HelpCircle className="text-[#0ff]" size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Platform Guide</h2>
                                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">How to use Code Refiner</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 cyber-scrollbar">
                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-[#0ff]">
                                <Key size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm italic">1. Setting up API Keys</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GuideStep
                                    num="01"
                                    title="Get your API Key"
                                    desc="Go to Google AI Studio, OpenAI, or Hugging Face. Generate a new API secret key."
                                />
                                <GuideStep
                                    num="02"
                                    title="Open Settings"
                                    desc="Click the 'APIs' button in the navbar or the floating gear in the corner."
                                />
                                <GuideStep
                                    num="03"
                                    title="Register Key"
                                    desc="Select the provider, paste your key, and give it a label. Hit 'Register Key' to save."
                                />
                                <GuideStep
                                    num="04"
                                    title="Activate"
                                    desc="Ensure your key is marked as 'ACTIVE' in the sidebar list to use it for analysis."
                                />
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-[#a855f7]">
                                <Sparkles size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm italic">2. Website Features</h3>
                            </div>
                            <div className="space-y-3">
                                <FeatureLine icon={<ShieldCheck size={14} />} text="Review: Real-time syntax & logic error detection with IDE markers." />
                                <FeatureLine icon={<Zap size={14} />} text="Refactor: Instant optimization for performance and readability." />
                                <FeatureLine icon={<MessageSquare size={14} />} text="Generate: Just describe what you need and the AI writes the code." />
                                <FeatureLine icon={<ArrowRight size={14} />} text="Convert: Seamlessly transform code between major languages (Python, TS, etc)." />
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle size={18} />
                                <h3 className="font-bold uppercase tracking-tight text-sm italic">3. Handling Errors</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white text-xs font-bold mb-1">Quota / Limit Error</h4>
                                    <p className="text-gray-500 text-[11px] leading-relaxed">
                                        This occurs when your free tier limit is reached. Wait for 60 seconds (for Gemini) or add a different provider like Hugging Face in Settings.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-white text-xs font-bold mb-1">Model Overload / Traffic</h4>
                                    <p className="text-gray-500 text-[11px] leading-relaxed">
                                        Happens when huge traffic hits the AI provider. Just click 'Retry' after a few seconds or switch to a different model ID in advanced settings.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="p-4 bg-white/2 border-t border-white/5 text-center">
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                            Built by Neural Coders - VGSEK
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

const GuideStep = ({ num, title, desc }: any) => (
    <div className="bg-white/3 border border-white/5 p-4 rounded-xl">
        <span className="text-[#0ff] font-black text-xs block mb-1">{num}</span>
        <h4 className="text-white text-xs font-bold mb-1">{title}</h4>
        <p className="text-gray-500 text-[10px] leading-relaxed">{desc}</p>
    </div>
);

const FeatureLine = ({ icon, text }: any) => (
    <div className="flex items-center gap-3 bg-white/2 p-2 px-3 rounded-lg border border-white/3">
        <div className="text-gray-400">{icon}</div>
        <p className="text-[11px] text-gray-400 font-medium tracking-wide">{text}</p>
    </div>
);
