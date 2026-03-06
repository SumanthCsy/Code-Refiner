import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, Languages, Wand2, Terminal } from 'lucide-react';

import geminiLogo from '../assets/gemini.png';
import openaiLogo from '../assets/openai.png';
import hfLogo from '../assets/huggingface.png';
import orLogo from '../assets/openrouter.png';

const features = [
    {
        id: 1,
        title: 'AI Error Detection',
        description: 'Instantly scan your code for syntax errors, logical bugs, and security vulnerabilities with neural precision.',
        icon: <ShieldAlert className="text-[#ff5f56]" size={32} />,
        color: 'from-red-500/20 to-red-900/10'
    },
    {
        id: 2,
        title: 'Intelligent Refactoring',
        description: 'Transform messy spaghetti code into clean, optimal, and highly readable architecture automatically.',
        icon: <RefreshCw className="text-[#0ff]" size={32} />,
        color: 'from-[#0ff]/20 to-[#0ff]/5'
    },
    {
        id: 3,
        title: 'Smart Code Generation',
        description: 'Describe what you need in plain English and watch the AI write the entire component or logic block.',
        icon: <div className="flex items-center text-[#ffbd2e]"><Wand2 size={32} /></div>,
        color: 'from-[#ffbd2e]/20 to-[#ffbd2e]/5'
    },
    {
        id: 4,
        title: 'Universal Language Converter',
        description: 'Seamlessly shift code between Python, Java, C++, JavaScript, TypeScript, and more language paradigms.',
        icon: <Languages className="text-[#b026ff]" size={32} />,
        color: 'from-[#b026ff]/20 to-[#b026ff]/5'
    }
];

export default function FeaturesGrid({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="py-8">
            <div className="text-center mb-12 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6"
                >
                    <span className="px-4 py-1.5 rounded-full bg-[#0ff]/5 border border-[#0ff]/20 text-[#0ff] text-[10px] font-black uppercase tracking-[0.3em] italic">
                        Neural Coders
                    </span>
                </motion.div>
                <h2 className="text-4xl sm:text-6xl font-black mb-6 italic tracking-tight pr-2">
                    NEXT-GEN <span className="animated-gradient-text px-1">CAPABILITIES</span>
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-sm sm:text-base font-medium leading-relaxed">
                    Experience the future of software development. Our suite of neural tools is designed to handle high-complexity tasks with autonomous precision.
                </p>

                {/* PRO LAUNCH BUTTON */}
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(176,38,255,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        onSelect('detect');
                    }}
                    className="group relative px-5 sm:px-10 py-3 sm:py-5 bg-gradient-to-r from-[#5a32fa] to-[#b026ff] rounded-2xl flex items-center gap-3 sm:gap-5 shadow-2xl transition-all overflow-hidden border border-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:rotate-12 transition-transform shadow-inner">
                        <Terminal size={18} className="sm:text-[24px] text-white" />
                    </div>
                    <div className="flex flex-col items-start leading-none relative">
                        <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1 sm:mb-1.5">Initialize Workspace</span>
                        <div className="flex flex-wrap sm:flex-nowrap">
                            {"Launch Work Space".split("").map((char, i) => (
                                <motion.span
                                    key={i}
                                    animate={{
                                        color: ["#ffffff", "#00ffff", "#b026ff", "#ffffff"],
                                        textShadow: ["0 0 0px #fff", "0 0 8px #0ff", "0 0 10px #b026ff", "0 0 0px #fff"]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "linear"
                                    }}
                                    className="text-sm sm:text-lg lg:text-xl font-black uppercase tracking-tight sm:tracking-widest italic pr-[0.1em]"
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="ml-1 sm:ml-4"
                    >
                        <Wand2 size={16} className="sm:text-[24px] text-[#0ff]" />
                    </motion.div>
                </motion.button>
            </div>

            {/* Logo Ticker */}
            <div className="mb-8 sm:mb-12 px-2 sm:px-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-px flex-1 bg-white/5" />
                    <h2 className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-700">Supported AI Models</h2>
                    <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="relative overflow-hidden w-full flex py-1 sm:py-4">
                    <motion.div
                        animate={{ x: [0, -1035] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="flex gap-3 sm:gap-8 whitespace-nowrap shrink-0"
                    >
                        {[...new Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3 sm:gap-8 shrink-0">
                                <LogoItem src={geminiLogo} name="Google Gemini" />
                                <LogoItem src={openaiLogo} name="OpenAI" />
                                <LogoItem src={hfLogo} name="Hugging Face" />
                                <LogoItem src={orLogo} name="OpenRouter" />
                                <LogoItem icon={<div className="font-black text-white">𝕏</div>} name="xAI Grok" />
                                <LogoItem icon={<Terminal className="text-gray-400" size={16} />} name="Custom APIs" />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
                {features.map((feature, idx) => (
                    <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => {
                            const mapping: Record<number, string> = { 1: 'detect', 2: 'refactor', 3: 'generate', 4: 'convert' };
                            onSelect(mapping[feature.id]);
                        }}
                        className={`glass-panel p-6 rounded-xl border border-[var(--color-cyber-border)] hover:border-[#0ff]/50 transition-all group overflow-hidden relative cursor-pointer flex flex-col items-start h-full`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="mb-6 p-3 bg-[var(--color-cyber-card)] rounded-lg inline-block border border-[var(--color-cyber-border)] group-hover:scale-110 transition-transform duration-300 relative z-10">
                            {feature.icon}
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-3 relative z-10 group-hover:text-[#0ff] transition-colors">{feature.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed relative z-10 group-hover:text-gray-200 transition-colors">
                            {feature.description}
                        </p>

                        <div className="mt-6 font-medium text-xs text-[#b026ff] flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all relative z-10">
                            <span>EXPLORE</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

const LogoItem = ({ src, icon, name }: any) => (
    <div className="flex items-center gap-3 glass-panel px-4 py-2 border border-white/5 bg-white/[0.01] rounded-xl group hover:border-[#0ff]/30 transition-all">
        <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden bg-black/40 shadow-inner">
            {src ? <img src={src} alt={name} className="w-4 h-4 object-contain opacity-40 group-hover:opacity-100 transition-opacity" /> : icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">{name}</span>
    </div>
);
