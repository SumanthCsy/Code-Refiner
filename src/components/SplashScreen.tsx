import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../lib/sounds';
import appLogo from '../assets/logo.png';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    useEffect(() => {
        playSound('splash');
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--color-cyber-dark)] p-6 overflow-hidden"
        >
            <div className="relative w-full max-w-lg flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center w-full"
                >
                    <div className="relative mb-6 sm:mb-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-[-15%] sm:inset-[-20%] rounded-full border-2 sm:border-4 border-dotted border-[#0ff]/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center"
                        >
                            <img src={appLogo} alt="Code Refiner" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]" />
                        </motion.div>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-widest mb-3 sm:mb-4 animated-gradient-text text-center px-4 leading-tight italic">
                        CODE REFINER
                    </h1>

                    <div className="flex flex-col items-center mb-8 sm:mb-12">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-400 tracking-[0.3em] sm:tracking-[0.5em] text-[8px] sm:text-[10px] uppercase mb-4 font-black italic"
                        >
                            Code Smarter, Not Harder.
                        </motion.p>

                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                            {["Detect", "Fix", "Improve"].map((text, i) => (
                                <React.Fragment key={text}>
                                    <motion.span
                                        initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
                                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                        transition={{ delay: 0.8 + (i * 0.2), duration: 0.8 }}
                                        className={`text-[9px] sm:text-xs font-black uppercase tracking-[0.2em] italic ${i === 1 ? 'text-[#b026ff] drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]' :
                                            i === 2 ? 'text-[#0ff] drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] opacity-80' :
                                                'text-[#0ff] drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]'
                                            }`}
                                    >
                                        {text}
                                    </motion.span>
                                    {i < 2 && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 0.15, scale: 1 }}
                                            transition={{ delay: 1.5 }}
                                            className="text-white h-3 w-[1px] bg-white/40"
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="text-center space-y-2 text-gray-400 glass-panel p-4 sm:p-6 rounded-2xl cyber-glow-purple border-white/5 w-full bg-white/[0.02]"
                    >
                        <p className="font-black text-white mb-3 sm:mb-4 uppercase tracking-[0.2em] text-[10px] sm:text-xs italic">Developed By &ndash; Neural Coders</p>
                        <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 text-xs font-bold italic uppercase tracking-widest text-[#0ff]/60">
                            <p className="hover:text-[#0ff] transition-colors cursor-default">Sumanth</p>
                            <p className="hover:text-[#0ff] transition-colors cursor-default">Venu</p>
                            <p className="hover:text-[#0ff] transition-colors cursor-default">Srinivas</p>
                            <p className="hover:text-[#0ff] transition-colors cursor-default">Ajay</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-gray-600">
                            <p>Vaageswari College Of Engineering</p>
                            <p className="text-[#b026ff]/60 mt-1 italic">(CSE &ndash; AI &amp; ML)</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Loading bar Container */}
                <div className="mt-12 sm:mt-16 w-full flex flex-col items-center">
                    <motion.div
                        className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#0ff] to-[#b026ff] rounded-full shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5, ease: "easeInOut" }}
                            onAnimationComplete={() => {
                                setTimeout(onComplete, 500);
                            }}
                        />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
