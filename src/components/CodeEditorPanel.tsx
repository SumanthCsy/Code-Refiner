import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Play, Copy, Check, RefreshCw, PenTool, Sparkles, Languages,
    Clipboard as ClipboardIcon
} from 'lucide-react';
import { generateGeminiContent, stripMarkdown } from '../lib/gemini';
import { triggerAppError } from '../lib/events';
import { playSound } from '../lib/sounds';

interface Props {
    activeMode: 'detect' | 'refactor' | 'generate' | 'convert' | null;
}

export default function CodeEditorPanel({ activeMode }: Props) {
    const [code, setCode] = useState('// Paste code here...\n');
    const [outputCode, setOutputCode] = useState('// Output will appear here...');
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('python');

    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [fixedCode, setFixedCode] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = (text: string) => {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) { console.error('Fallback copy failed', err); }
                document.body.removeChild(textArea);
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) { console.error('Direct fallback copy failed', err); }
            document.body.removeChild(textArea);
        }
    };

    // Auto-scroll on action (mobile)
    useEffect(() => {
        if (loading && window.innerWidth < 1024) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [loading]);

    // Placeholder Typing Effect
    const prompts = [
        "Create a professional login page using HTML, CSS, and JavaScript...",
        "Write a simple Python calculator program...",
        "Generate a responsive navigation bar using HTML and CSS....",
        "Create a JavaScript to-do list application...",
        "Write a Simple C Program..."
    ];
    const [placeholder, setPlaceholder] = useState("");
    const [promptIndex, setPromptIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [typeSpeed, setTypeSpeed] = useState(50);

    useEffect(() => {
        const handleTyping = () => {
            const fullPrompt = prompts[promptIndex];
            setPlaceholder(
                isDeleting
                    ? fullPrompt.substring(0, placeholder.length - 1)
                    : fullPrompt.substring(0, placeholder.length + 1)
            );

            if (!isDeleting && placeholder === fullPrompt) {
                setTimeout(() => setIsDeleting(true), 1500); // Pause at end
                setTypeSpeed(25);
            } else if (isDeleting && placeholder === "") {
                setIsDeleting(false);
                setPromptIndex((prev) => (prev + 1) % prompts.length);
                setTypeSpeed(50);
            }
        };

        const timer = setTimeout(handleTyping, typeSpeed);
        return () => clearTimeout(timer);
    }, [placeholder, isDeleting, promptIndex, typeSpeed]);

    const monacoRef = useRef<any>(null);
    const editorRef = useRef<any>(null);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
    };

    const handleAction = async () => {
        if (!activeMode) return;
        setLoading(true);

        // Clear markers
        if (monacoRef.current && editorRef.current) {
            monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'owner', []);
        }

        try {
            let prompt = "";
            const simpleCleanMsg = "CRITICAL: Provide SIMPLE, CLEAN, and HIGHLY UNDERSTANDABLE code. Focus on logic clarity. STRICTLY avoid line-by-line comments describing basic syntax or common language features. Only document truly complex logic.";

            if (activeMode === 'detect') {
                prompt = `${simpleCleanMsg}\n\nULTRA-CRITICAL: PERFORM TOTAL NEURAL DEEP SCAN (8 CATEGORIES):
1. Syntax (Critical), 2. Runtime (High), 3. Type (Medium), 4. Logical (Medium), 5. Quality (Low), 6. Security (Critical), 7. Performance (Info), 8. Best Practices (Low).
Respond ONLY with JSON: {"errors":[{"line":1, "message":".."}], "correctedCode":".."}. List EVERY SINGLE ISSUE.
Code:\n${code}`;
                const raw = await generateGeminiContent(prompt);
                const parsed = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());

                if (parsed.errors?.length && monacoRef.current && editorRef.current) {
                    playSound('error');
                    const markers = parsed.errors.map((e: any) => ({
                        startLineNumber: e.line || 1, startColumn: 1, endLineNumber: e.line || 1, endColumn: 100,
                        message: e.message, severity: monacoRef.current.MarkerSeverity.Error
                    }));
                    monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'owner', markers);
                } else if (!parsed.errors?.length) {
                    playSound('clean');
                }

                let report = parsed.errors?.length ? `// ⚠️ Found ${parsed.errors.length} issues\n` : `// ✅ Code is clean\n`;
                if (parsed.correctedCode) {
                    setFixedCode(parsed.correctedCode);
                    report += `\n${parsed.correctedCode}`;
                }
                setOutputCode(report);

            } else {
                if (activeMode === 'refactor') {
                    prompt = `${simpleCleanMsg}\n\nREFACTOR CATEGORIES: Logic, Quality, Performance, Security. Provide ONLY the refactored code block.\n\n${code}`;
                } else if (activeMode === 'generate') {
                    prompt = `${simpleCleanMsg}\n\nGENERATE CATEGORIES: Functional, Quality, Performance, Security.\nGenerate code for: ${generatePrompt}\n\nContext code:\n${code}`;
                } else if (activeMode === 'convert') {
                    prompt = `${simpleCleanMsg}\n\nCONVERT to ${targetLanguage}. Provide ONLY clean, converted code without syntax explanations or bullets.\n\nSource code:\n${code}`;
                }

                const raw = await generateGeminiContent(prompt);
                setOutputCode(stripMarkdown(raw));
            }
        } catch (error: any) {
            if (error.message === 'LIMIT_EXPIRED') triggerAppError('QUOTA');
            else if (error.message === 'MODEL_OVERLOADED') triggerAppError('OVERLOAD');
            else setOutputCode(`// Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const LANGUAGES = [
        { id: 'python', name: 'Python' },
        { id: 'javascript', name: 'JavaScript' },
        { id: 'typescript', name: 'TypeScript' },
        { id: 'java', name: 'Java' },
        { id: 'c', name: 'C' },
        { id: 'cpp', name: 'C++' },
        { id: 'csharp', name: 'C#' },
        { id: 'go', name: 'Go' },
        { id: 'rust', name: 'Rust' },
        { id: 'kotlin', name: 'Kotlin' },
        { id: 'swift', name: 'Swift' },
        { id: 'php', name: 'PHP' },
        { id: 'ruby', name: 'Ruby' },
    ];

    return (
        <div className="w-full h-full flex flex-col gap-4 lg:gap-6 min-h-0">
            {/* Control Bar */}
            {activeMode === 'generate' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-2 sm:p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl bg-gradient-to-r from-[#0ff]/5 to-transparent">
                    <div className="flex-1 relative flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative group">
                            <input
                                type="text" value={generatePrompt} onChange={e => setGeneratePrompt(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAction()}
                                placeholder={placeholder}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-[#0ff]/60 transition-all placeholder:text-white/20 placeholder:italic pr-12 sm:pr-24 shadow-inner"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                <Sparkles size={14} className="text-[#0ff] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0ff]">Ai Prompt</span>
                            </div>
                        </div>
                        <button
                            onClick={handleAction} disabled={loading || !generatePrompt.trim()}
                            className="px-8 py-4 bg-gradient-to-r from-[#0ff] to-[#5a32fa] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-20 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,255,0.2)] active:scale-95 shrink-0"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {loading ? 'Processing...' : 'Generate'}
                        </button>
                    </div>
                </motion.div>
            )}

            {activeMode === 'convert' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
                        <Languages size={14} className="text-[#b026ff]" />
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Target Language</span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto cyber-scrollbar pr-2">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.id} onClick={() => setTargetLanguage(lang.id)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${targetLanguage === lang.id ? 'bg-[#b026ff]/10 text-[#b026ff] border-[#b026ff]/30 shadow-[0_0_10px_rgba(176,38,255,0.1)]' : 'text-gray-500 hover:text-gray-300 border-white/5 hover:bg-white/5'}`}
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Editor Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Input Editor - HIDDEN IN GENERATE MODE */}
                {activeMode !== 'generate' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-none w-full lg:w-1/2 glass-panel rounded-2xl border border-white/5 flex flex-col p-5 shadow-2xl relative group overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#0ff]/10 flex items-center justify-center border border-[#0ff]/20">
                                    <Terminal className="text-[#0ff]" size={16} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Source Editor</span>
                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none">Input Code</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        try {
                                            const text = await navigator.clipboard.readText();
                                            if (text) {
                                                setCode(text);
                                                playSound('popup');
                                            }
                                        } catch (err) {
                                            alert("Clipboard access is restricted. Please long-press inside the editor to paste manually.");
                                        }
                                    }}
                                    className="p-1.5 px-3 text-[10px] font-black tracking-widest text-[#0ff] border border-[#0ff]/20 hover:border-[#0ff]/40 rounded-lg transition-all bg-[#0ff]/5 shrink-0 flex items-center gap-1.5"
                                >
                                    <ClipboardIcon size={12} />
                                    PASTE
                                </button>
                                <button onClick={() => setCode('')} className="p-1.5 px-3 text-[9px] font-black tracking-widest text-gray-600 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-lg transition-all bg-black/20 shrink-0">CLEAR</button>
                            </div>
                        </div>

                        <div className="flex-none h-[450px] lg:min-h-[600px] rounded-xl border border-white/5 overflow-hidden bg-black/20 relative z-20 touch-auto">
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                value={code}
                                onChange={val => setCode(val || '')}
                                onMount={handleEditorDidMount}
                                options={{
                                    fontSize: 13,
                                    minimap: { enabled: false },
                                    lineNumbersMinChars: 3,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 10 },
                                    automaticLayout: true
                                }}
                            />
                        </div>

                        {/* Prominent Execute Button */}
                        <motion.button
                            whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAction}
                            disabled={loading}
                            className="mt-5 w-full py-4 bg-gradient-to-r from-[#5a32fa] to-[#a855f7] rounded-xl text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(176,38,255,0.3)] transition-all disabled:opacity-50 shadow-2xl relative z-10 italic shrink-0"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
                            {loading ? (
                                <span className="animate-pulse">
                                    {activeMode === 'refactor' ? 'Refactoring Neural Patterns...' :
                                        activeMode === 'convert' ? 'Applying Linguistic Translation...' :
                                            'Processing Neural Request...'}
                                </span>
                            ) : `EXECUTE ${activeMode?.toUpperCase()}`}
                        </motion.button>

                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#5a32fa]/5 blur-[80px] pointer-events-none" />
                    </motion.div>
                )}

                {/* Output */}
                <div className="flex-none w-full lg:w-1/2 glass-panel rounded-2xl border border-white/5 flex flex-col p-5 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white/[0.01] to-transparent" ref={resultsRef}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
                                <PenTool className="text-[#a855f7]" size={16} />
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Refined Output</span>
                                <div className="text-[9px] text-gray-700 font-bold uppercase tracking-widest leading-none">Neural Response</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPreviewOpen(true)}
                                className="p-2 px-3 rounded-xl border border-[#0ff]/20 text-[#0ff] bg-[#0ff]/5 hover:bg-[#0ff]/10 transition-all flex items-center gap-2"
                                title="Preview Output"
                            >
                                <Play size={14} />
                                <span className="text-[10px] font-black tracking-widest">PREVIEW</span>
                            </button>
                            <button
                                onClick={() => copyToClipboard(outputCode)}
                                className={`p-2 px-4 rounded-xl border transition-all flex items-center gap-2 group ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="group-hover:text-white transition-colors" />}
                                <span className="text-[10px] font-black tracking-widest">{copied ? 'COPIED' : 'COPY'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-none h-[450px] lg:min-h-[600px] rounded-xl border border-white/5 overflow-hidden bg-black/40 relative z-20 touch-auto">
                        {loading && (
                            <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-[2px]">
                                <div className="relative w-20 h-20 mb-6">
                                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-[#a855f7] opacity-60" />
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-r-2 border-[#a855f7]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PenTool size={20} className="text-[#a855f7] animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-[#a855f7] font-black uppercase tracking-widest text-xs mb-2">Neural Refining...</h3>
                                <div className="flex gap-1 justify-center">
                                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} className="w-1 h-1 rounded-full bg-[#a855f7]" />)}
                                </div>
                            </div>
                        )}
                        <Editor
                            height="100%" theme="vs-dark" value={outputCode}
                            onChange={v => setOutputCode(v || '')}
                            options={{
                                fontSize: 13,
                                minimap: { enabled: false },
                                lineNumbersMinChars: 3,
                                scrollBeyondLastLine: false,
                                padding: { top: 10 },
                                automaticLayout: true
                            }}
                        />
                    </div>

                    {fixedCode && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between shadow-xl"
                        >
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Neural Fix Ready</span>
                                <span className="text-[10px] text-gray-400 italic">Optimized code generated</span>
                            </div>
                            <button onClick={() => setCode(fixedCode)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 uppercase tracking-widest italic leading-none">Apply Fix</button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 pointer-events-none">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full h-full max-w-6xl glass-panel rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto"
                        >
                            <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/40 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#0ff]/10 flex items-center justify-center border border-[#0ff]/20">
                                        <Play size={16} className="text-[#0ff]" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-white">Live Execution Preview</span>
                                </div>
                                <button onClick={() => setPreviewOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                                    <Check size={20} />
                                </button>
                            </div>
                            <div className="flex-1 bg-white relative">
                                <iframe
                                    srcDoc={outputCode}
                                    title="Preview"
                                    className="w-full h-full border-none"
                                    sandbox="allow-scripts"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
