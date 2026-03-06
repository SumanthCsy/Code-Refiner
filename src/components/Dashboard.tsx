import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import appLogo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import {
    Code2, Wand2, RefreshCw, Languages, Settings2, ShieldCheck,
    Key, User as UserIcon, LogOut, X, ChevronDown, Terminal, PanelLeft
} from 'lucide-react';
import CodeEditorPanel from './CodeEditorPanel';
import AnalyzePanel from './AnalyzePanel';
import FeaturesGrid from './FeaturesGrid';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import LogoutConfirmModal from './LogoutConfirmModal';


interface DashboardProps {
    forceSettingsOpen?: boolean;
    onSettingsClosed?: () => void;
    onOpenAuth?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ forceSettingsOpen, onSettingsClosed, onOpenAuth }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname === '/workspace' ? 'editor' : 'features';
    const [activeFeature, setActiveFeature] = useState<'detect' | 'refactor' | 'generate' | 'convert' | null>('detect');

    // Modals
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Allow parent (App.tsx) to open Settings via prop
    useEffect(() => {
        if (forceSettingsOpen) {
            setSettingsOpen(true);
            onSettingsClosed?.();
        }
    }, [forceSettingsOpen, onSettingsClosed]);

    const handleLogout = async () => {
        await logout();
        setLogoutOpen(false);
        setUserMenuOpen(false);
    };

    const handleFeatureNavigation = (featureId: string) => {
        navigate('/workspace');
        setActiveFeature(featureId as any);
    };

    return (
        <div className="min-h-screen bg-[var(--color-cyber-dark)] flex flex-col font-[var(--font-inter)] selection:bg-[#0ff] selection:text-black">

            {/* ── NAVBAR ── */}
            <nav className="border-b border-[var(--color-cyber-border)] glass-panel sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo & Window Controls (Mac Style) */}
                    <div className="flex items-center space-x-3 lg:space-x-8">
                        <div className="hidden lg:flex gap-1.5 mr-2">
                            <div className="w-3 h-3 rounded-full mac-btn-red" />
                            <div className="w-3 h-3 rounded-full mac-btn-yellow" />
                            <div className="w-3 h-3 rounded-full mac-btn-green" />
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-9 h-9 sm:w-14 sm:h-14 flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 transition-all overflow-hidden shrink-0">
                                <img src={appLogo} alt="Code Refiner" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-[11px] sm:text-lg tracking-tight sm:tracking-tighter text-white leading-none uppercase italic pr-1">Code Refiner</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs (Responsive) */}
                    <div className="hidden md:flex items-center space-x-1 glass-panel rounded-full px-1 py-1 border border-white/5">
                        <NavTab active={activeTab === 'editor'} onClick={() => navigate('/workspace')} label="Workspace" />
                        <NavTab active={activeTab === 'features'} onClick={() => navigate('/')} label="Features" />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3">
                        {/* API Key Quick Access */}
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12122b] border border-[#0ff]/20 text-[#0ff] text-xs font-bold hover:bg-[#1a1a3d] transition-all group"
                        >
                            <Key size={14} className="group-hover:rotate-12 transition-transform" />
                            <span className="hidden lg:inline">APIs</span>
                        </button>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 bg-[#12121c] p-1 pr-3 rounded-full border border-[var(--color-cyber-border)] hover:border-[#0ff]/50 transition-all"
                                >
                                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0D0D18&color=00FFFF`} alt="User" className="w-7 h-7 rounded-full border border-[#0ff]/50" />
                                    <span className="text-xs font-bold text-gray-300 hidden sm:block max-w-[80px] truncate">{user.displayName || 'User'}</span>
                                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-3 w-48 bg-[#12121c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-50"
                                            >
                                                <button onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium">
                                                    <UserIcon size={16} className="text-[#0ff]" /> Edit Profile
                                                </button>
                                                <button onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm font-medium">
                                                    <Settings2 size={16} className="text-[#a855f7]" /> Settings
                                                </button>
                                                <div className="my-1 border-t border-white/5" />
                                                <button onClick={() => setLogoutOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all text-sm font-medium">
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenAuth}
                                className="text-xs sm:text-sm bg-gradient-to-r from-[#0ff] to-[#5a32fa] text-white font-bold px-4 py-1.5 rounded-lg hover:brightness-110 transition-all cyber-glow shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                            >
                                Login
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white shadow-xl flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mobileMenuOpen ? 'close' : 'open'}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {mobileMenuOpen ? <X size={20} /> : <PanelLeft size={20} className="text-[#0ff]" />}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            className="md:hidden border-t border-white/5 px-4 py-4 space-y-2 bg-[#0d0d18]/98 backdrop-blur-2xl absolute w-full left-0 top-[60px] shadow-2xl z-50 overflow-hidden"
                        >
                            <button
                                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                                className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between border transition-all ${activeTab === 'features' ? 'bg-[#5a32fa]/10 text-[#0ff] border-[#0ff]/20' : 'text-gray-400 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold uppercase tracking-widest text-[10px] italic">Core Features</span>
                                </div>
                                <ChevronDown size={14} className="-rotate-90 opacity-40" />
                            </button>
                            <button
                                onClick={() => { navigate('/workspace'); setMobileMenuOpen(false); }}
                                className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between border transition-all ${activeTab === 'editor' ? 'bg-[#b026ff]/10 text-[#b026ff] border-[#b026ff]/20' : 'text-gray-400 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Terminal size={16} />
                                    <span className="font-bold uppercase tracking-widest text-[10px] italic">Workspace</span>
                                </div>
                                <ChevronDown size={14} className="-rotate-90 opacity-40" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-6 lg:p-8 flex flex-col min-w-0 pb-40 sm:pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === 'editor' && (
                        <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-w-0">

                            {/* Feature Selector */}
                            <div className="mb-6 flex flex-wrap gap-2 items-center glass-panel p-2 rounded-xl border border-white/5 overflow-x-auto cyber-scrollbar pb-3">
                                <FeatureTool icon={<ShieldCheck size={16} />} label="Review" active={activeFeature === 'detect'} onClick={() => setActiveFeature('detect')} />
                                <FeatureTool icon={<RefreshCw size={16} />} label="Refactor" active={activeFeature === 'refactor'} onClick={() => setActiveFeature('refactor')} />
                                <FeatureTool icon={<Wand2 size={16} />} label="Generate" active={activeFeature === 'generate'} onClick={() => setActiveFeature('generate')} />
                                <FeatureTool icon={<Languages size={16} />} label="Convert" active={activeFeature === 'convert'} onClick={() => setActiveFeature('convert')} />
                            </div>

                            {/* Main Viewport */}
                            <div className="flex-1 min-h-0 min-w-0">
                                {activeFeature === 'detect' ? <AnalyzePanel /> : <CodeEditorPanel activeMode={activeFeature} />}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'features' && (
                        <motion.div key="features" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                            <FeaturesGrid onSelect={handleFeatureNavigation} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 glass-panel mt-20 mb-10 mx-4 rounded-2xl">
                <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-white">
                            <Code2 className="text-[#0ff]" size={20} />
                            <span className="font-bold text-lg tracking-tight">Code Refiner</span>
                        </div>
                        <p className="max-w-xs leading-relaxed">
                            Professional AI-powered code analysis and refactoring suite building the future of automated code review.
                        </p>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                            Neural Coders • 2026
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-white uppercase tracking-widest text-[11px]">Development Team</h3>
                        <ul className="space-y-2 text-xs font-medium">
                            <li className="flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-[#0ff]/40 group-hover:bg-[#0ff]" /> Sumanth</li>
                            <li className="flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-[#0ff]/40 group-hover:bg-[#0ff]" /> Venu</li>
                            <li className="flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-[#0ff]/40 group-hover:bg-[#0ff]" /> Srinivas</li>
                            <li className="flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-[#0ff]/40 group-hover:bg-[#0ff]" /> Ajay</li>
                        </ul>
                    </div>

                    <div className="flex flex-col md:items-end justify-center space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Team Lead & Developer</p>
                        <a
                            href="https://sumanthcsy.netlify.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group px-5 py-2 rounded-xl overflow-hidden transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#5a32fa]/20 to-[#0ff]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 border border-white/5 group-hover:border-[#0ff]/30 rounded-xl transition-all" />
                            <span className="relative z-10 font-black italic animated-gradient-text tracking-tighter sm:tracking-normal pr-1 brightness-125">@Sumanth Csy</span>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#0ff] group-hover:w-2/3 transition-all duration-500" />
                        </a>
                    </div>
                </div>
            </footer>

            {/* ── MODALS ── */}
            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
            <LogoutConfirmModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={handleLogout} />

            <style>{`
                .mac-btn-red { background: #ff5f57; box-shadow: 0 0 5px rgba(255,95,87,0.3); }
                .mac-btn-yellow { background: #febc2e; box-shadow: 0 0 5px rgba(254,188,46,0.3); }
                .mac-btn-green { background: #28c840; box-shadow: 0 0 5px rgba(40,200,64,0.3); }
                .cyber-grid-small { background-image: radial-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 0); background-size: 20px 20px; }
            `}</style>
        </div>
    );
};

// ── Shared Subcomponents ──

const NavTab = ({ active, onClick, label, icon }: any) => (
    <button
        onClick={onClick}
        className={`px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-[var(--color-cyber-purple)] text-white shadow-[0_0_15px_rgba(176,38,255,0.4)]' : 'text-gray-500 hover:text-white'
            }`}
    >
        {icon}{label}
    </button>
);

const FeatureTool = ({ icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all border shrink-0 ${active
            ? 'bg-[#5a32fa]/10 border-[#5a32fa]/50 text-[#0ff] shadow-[0_0_15px_rgba(0,255,255,0.1)]'
            : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'
            }`}
    >
        {icon}
        <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </button>
);

export default Dashboard;
