import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, PenTool, Info, Check, Copy,
    RefreshCw, Terminal, Zap, CheckCircle2,
    AlertTriangle, AlertCircle, AlertOctagon, ChevronRight, XCircle, ShieldAlert,
    Clipboard as ClipboardIcon
} from 'lucide-react';
import { generateGeminiContent } from '../lib/gemini';
import { triggerAppError } from '../lib/events';
import { playSound } from '../lib/sounds';

import geminiLogo from '../assets/gemini.png';
import openaiLogo from '../assets/openai.png';
import hfLogo from '../assets/huggingface.png';
import orLogo from '../assets/openrouter.png';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeError {
    line: number;
    column?: number;
    code: string;
    message: string;
    explanation: string;
    fix?: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
}

interface AnalysisResult {
    language: string;
    issues: { critical: number; high: number; medium: number; low: number };
    errors: CodeError[];
    review: string[];
    suggestions: string[];
    rewrittenCode: string;
    keyImprovements: string[];
    explanation: string;
}

const SEV = {
    critical: { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-700/60', icon: <AlertOctagon size={14} />, dot: 'bg-red-500' },
    error: { label: 'ERROR', color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-700/60', icon: <XCircle size={14} />, dot: 'bg-orange-500' },
    warning: { label: 'WARNING', color: 'text-yellow-400', bg: 'bg-yellow-950/60', border: 'border-yellow-700/60', icon: <AlertTriangle size={14} />, dot: 'bg-yellow-500' },
    info: { label: 'INFO', color: 'text-blue-400', bg: 'bg-blue-950/60', border: 'border-blue-700/60', icon: <AlertCircle size={14} />, dot: 'bg-blue-500' },
};

export default function AnalyzePanel() {
    const [innerTab, setInnerTab] = useState<'review' | 'rewritten' | 'how'>('review');
    const [rightTab, setRightTab] = useState<'errors' | 'review' | 'suggestions'>('errors');

    const [code, setCode] = useState('// Paste code you want reviewed here...\n');
    const [inputLanguage] = useState('javascript');

    const [focus, setFocus] = useState({ bugs: true, performance: true, security: true, bestPractices: true });

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [expandedError, setExpandedError] = useState<number | null>(null);

    const monacoRef = useRef<any>(null);
    const editorRef = useRef<any>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic (mobile)
    useEffect(() => {
        if (loading && window.innerWidth < 1024) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [loading]);

    useEffect(() => {
        if (results && !loading && window.innerWidth < 1024) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [results]);

    // Handle external tab switch (from popup)
    useEffect(() => {
        const handler = () => setInnerTab('rewritten');
        window.addEventListener('show-rewritten-tab', handler);
        return () => window.removeEventListener('show-rewritten-tab', handler);
    }, []);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
    };

    const applyMonacoMarkers = (errors: CodeError[]) => {
        if (!monacoRef.current || !editorRef.current) return;
        const monaco = monacoRef.current;
        const model = editorRef.current.getModel();
        if (!model) return;

        const markers = errors.map(err => ({
            startLineNumber: err.line,
            startColumn: err.column || 1,
            endLineNumber: err.line,
            endColumn: model.getLineMaxColumn(err.line) || 100,
            message: `[${(err.severity || 'error').toUpperCase()}] ${err.message}`,
            severity:
                err.severity === 'critical' ? monaco.MarkerSeverity.Error :
                    err.severity === 'error' ? monaco.MarkerSeverity.Error :
                        err.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                            monaco.MarkerSeverity.Info,
        }));
        monaco.editor.setModelMarkers(model, 'code-refiner', markers);
    };

    const clearMarkers = () => {
        if (monacoRef.current && editorRef.current) {
            monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'code-refiner', []);
        }
    };

    const handleAnalyze = async (autoSwitchToRewritten = false) => {
        if (!code.trim() || code.trim() === '// Paste code you want reviewed here...') return;
        setLoading(true);
        clearMarkers();

        const focusAreas = [
            focus.bugs && 'Bugs & Syntax Errors',
            focus.performance && 'Performance Issues',
            focus.security && 'Security Vulnerabilities',
            focus.bestPractices && 'Best Practices',
        ].filter(Boolean);

        const prompt = `You are an elite software architect and senior code refactor engine.
FOCUS ON: ${focusAreas.join(', ')}.

PROCESS RULE: This is an ELITE REFACTORING. 
The "rewrittenCode" field MUST be the final, 100% bug-free, and production-ready code.
It must resolve every Syntax, Runtime, Logical, and Security vulnerability.
DO NOT use placeholders. Provide the FULL refactored code block exactly as in a high-end refactor process.

RESPOND ONLY WITH VALID JSON. NO PREAMBLE. NO MARKDOWN.
{
  "language": "detected language",
  "issues": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
  "errors": [
    { "line": 1, "column": 1, "code": "snippet", "message": "msg", "explanation": "why", "fix": "fix", "severity": "error" }
  ],
  "review": ["Elite logic review"],
  "suggestions": ["Performance optimization"],
  "rewrittenCode": "THE FULL, 100% ERROR-FREE REFACTORED CODE BLOCK.",
  "keyImprovements": ["Step 1", "Step 2"],
  "explanation": "Brief summary of the architectural changes."
}
ULTRA-CRITICAL: PERFORM TOTAL NEURAL DEEP SCAN. DO NOT SKIP ANY ERROR.

Code:
${code}`;

        try {
            setError(null);
            const rawResponse = await generateGeminiContent(prompt);

            // Extract the JSON object by finding the first { and last }
            const start = rawResponse.indexOf('{');
            const end = rawResponse.lastIndexOf('}');

            if (start === -1 || end === -1) {
                throw new Error("The neural engine returned a plain-text response instead of the required JSON structure.");
            }

            const rawJson = rawResponse.substring(start, end + 1);

            const safeParseJSON = (raw: string) => {
                let s = raw.trim();

                // 1. Try raw parse first (best results)
                try { return JSON.parse(s); } catch (e) { }

                // 2. Fix missing commas immediately
                s = s.replace(/\}\s*\{/g, '}, {');
                s = s.replace(/\]\s*\[/g, '], [');
                s = s.replace(/"\s*"/g, '", "');

                // 3. Fix unquoted keys safely (avoiding double-quoting)
                s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:(?!:)/g, (m, p1, p2) => {
                    if (p1.trim().endsWith('"') || p1.trim().endsWith("'")) return m;
                    return `${p1}"${p2}":`;
                });

                // 4. Remove duplicate quotes and trailing commas
                s = s.replace(/"{2,}/g, '"');
                s = s.replace(/,\s*([\]\}])/g, '$1');

                // 5. Final attempt with newline handling
                try {
                    return JSON.parse(s);
                } catch (e) {
                    s = s.replace(/\n/g, '\\n');
                    return JSON.parse(s);
                }
            };

            let parsed: AnalysisResult;
            try {
                parsed = safeParseJSON(rawJson);
            } catch (e) {
                // retry with extra cleanup
                parsed = safeParseJSON(rawJson.replace(/\n/g, ' '));
            }
            setResults(parsed);
            setRightTab('errors');

            if (parsed.errors?.length) {
                playSound('error');
                applyMonacoMarkers(parsed.errors);
                if (editorRef.current) editorRef.current.revealLineInCenter(parsed.errors[0].line);
            } else {
                playSound('clean');
            }

            if (autoSwitchToRewritten) {
                setInnerTab('rewritten');
                if (parsed.rewrittenCode) {
                    setCode(parsed.rewrittenCode);
                    playSound('clean');
                }
            }
        } catch (err: any) {
            if (err.message === 'LIMIT_EXPIRED') triggerAppError('QUOTA');
            else if (err.message === 'MODEL_OVERLOADED') triggerAppError('OVERLOAD');
            else setError(err.message || 'An unexpected error occurred during neural analysis.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                // Fallback for non-secure contexts or mobile
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

    return (
        <div className="w-full h-full flex flex-col gap-4 lg:gap-6">
            {/* Top Navigation */}
            <div className="flex space-x-4 lg:space-x-6 border-b border-white/5 pb-2 overflow-x-auto cyber-scrollbar shrink-0">
                <TabButton active={innerTab === 'review'} onClick={() => setInnerTab('review')} icon={<Search size={14} />} label="Code Review" mobileLabel="Review" />
                <TabButton active={innerTab === 'rewritten'} onClick={() => setInnerTab('rewritten')} icon={<PenTool size={14} />} label="Rewritten Code" mobileLabel="Rewritten" />
                <TabButton active={innerTab === 'how'} onClick={() => setInnerTab('how')} icon={<Info size={14} />} label="How It Works" mobileLabel="How to Use" />
            </div>

            <div className="flex-1 min-h-[600px] lg:relative">
                <AnimatePresence mode="wait">
                    {innerTab === 'review' && (
                        <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lg:absolute lg:inset-0 relative w-full h-auto lg:h-full flex flex-col lg:flex-row gap-6">
                            {/* Editor Panel */}
                            <div className="flex-none lg:flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col p-4 h-[500px] lg:min-h-[600px]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="text-[#0ff]" size={16} />
                                        <span className="text-sm font-bold text-white">Your Source</span>
                                    </div>
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
                                        className="p-1 px-3 text-[10px] font-black tracking-widest text-[#0ff] border border-[#0ff]/20 hover:border-[#0ff]/40 rounded-lg transition-all bg-[#0ff]/5 shrink-0 flex items-center gap-1.5"
                                    >
                                        <ClipboardIcon size={12} />
                                        PASTE
                                    </button>
                                </div>
                                <div className="flex-1 min-h-[250px] border border-white/5 rounded-xl overflow-hidden mb-4 relative z-20">
                                    <Editor height="100%" theme="vs-dark" language={inputLanguage} value={code} onChange={val => setCode(val || '')} onMount={handleEditorDidMount} options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <CheckboxItem label="Bugs" checked={focus.bugs} onChange={() => setFocus({ ...focus, bugs: !focus.bugs })} color="text-[#0ff]" />
                                    <CheckboxItem label="Performance" checked={focus.performance} onChange={() => setFocus({ ...focus, performance: !focus.performance })} color="text-red-400" />
                                    <CheckboxItem label="Security" checked={focus.security} onChange={() => setFocus({ ...focus, security: !focus.security })} color="text-yellow-400" />
                                    <CheckboxItem label="Best Practices" checked={focus.bestPractices} onChange={() => setFocus({ ...focus, bestPractices: !focus.bestPractices })} color="text-orange-400" />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleAnalyze()} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-[#5a32fa] to-[#9d52ff] border border-[#5a32fa]/30 rounded-xl text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden group shadow-lg">
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={14} className="animate-spin" />
                                                <span className="animate-pulse">Scanning...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Search size={14} className="group-hover:scale-110 transition-transform" />
                                                Run Scan
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => handleAnalyze(true)} disabled={loading} className="flex-1 py-3 bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/30 rounded-xl text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 group shadow-lg">
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={14} className="animate-spin" />
                                                <span className="animate-pulse">Fixing...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <PenTool size={14} className="group-hover:rotate-12 transition-transform" />
                                                Auto Fix
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Results Panel */}
                            <div className="flex-none lg:flex-1 glass-panel rounded-2xl border border-white/5 p-4 flex flex-col h-[600px] lg:min-h-[600px]" ref={resultsRef}>
                                <div className="grid grid-cols-4 gap-2 mb-4 shrink-0">
                                    <ScoreCard label="Crit" count={results?.issues?.critical ?? '-'} color="text-red-500" border="border-red-500/10" />
                                    <ScoreCard label="High" count={results?.issues?.high ?? '-'} color="text-orange-500" border="border-orange-500/10" />
                                    <ScoreCard label="Med" count={results?.issues?.medium ?? '-'} color="text-yellow-500" border="border-yellow-500/10" />
                                    <ScoreCard label="Low" count={results?.issues?.low ?? '-'} color="text-blue-500" border="border-blue-500/10" />
                                </div>

                                <div className="flex gap-4 border-b border-white/5 pb-2 mb-3 shrink-0">
                                    <button onClick={() => setRightTab('errors')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${rightTab === 'errors' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-600'}`}>Errors</button>
                                    <button onClick={() => setRightTab('review')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${rightTab === 'review' ? 'border-[#0ff] text-[#0ff]' : 'border-transparent text-gray-600'}`}>Review</button>
                                    <button onClick={() => setRightTab('suggestions')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${rightTab === 'suggestions' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-600'}`}>Suggestions</button>
                                </div>

                                <div className="flex-1 overflow-y-auto cyber-scrollbar pr-1 space-y-2 relative">
                                    {error && (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/20">
                                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                                <AlertOctagon className="text-red-500" size={32} />
                                            </div>
                                            <h3 className="text-red-400 font-bold mb-1 uppercase tracking-tight">Neural Sync Error</h3>
                                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black leading-relaxed">{error}</p>
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="absolute inset-0 z-20 bg-[var(--color-cyber-dark)]/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                            <div className="relative w-24 h-24 mb-6">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-b-2 border-[#0ff] shadow-[0_0_15px_rgba(0,255,255,0.4)]" />
                                                <motion.div animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-4 rounded-full bg-[#0ff]/10 border border-[#0ff]/30 flex items-center justify-center">
                                                    <Search size={24} className="text-[#0ff] animate-pulse" />
                                                </motion.div>
                                            </div>
                                            <h3 className="text-[#0ff] font-black uppercase tracking-widest text-sm mb-2">Neural Scan in Progress</h3>
                                            <div className="flex gap-1 justify-center">
                                                {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#0ff]" />)}
                                            </div>
                                        </div>
                                    )}

                                    {rightTab === 'errors' && (
                                        results ? (
                                            results.errors.length > 0 ? (
                                                results.errors.map((err, idx) => (
                                                    <ErrorItem key={idx} err={err} expanded={expandedError === idx} onToggle={() => setExpandedError(expandedError === idx ? null : idx)} />
                                                ))
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                                        <CheckCircle2 className="text-emerald-500" size={32} />
                                                    </div>
                                                    <h3 className="text-emerald-400 font-bold mb-1">Code is Clean</h3>
                                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">No errors detected</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-700 italic text-xs">No analysis yet.</div>
                                        )
                                    )}
                                    {rightTab === 'review' && results && (
                                        <div className="text-[11px] text-gray-400 leading-extra-loose whitespace-pre-wrap py-2 font-medium space-y-3">
                                            {results.review ? (
                                                Array.isArray(results.review)
                                                    ? results.review.map((item, i) => (
                                                        <div key={i} className="flex gap-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                                                            <div className="w-1 h-1 rounded-full bg-[#0ff] mt-1.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))
                                                    : <div>{results.review}</div>
                                            ) : 'No review notes available.'}
                                        </div>
                                    )}
                                    {rightTab === 'suggestions' && results && (
                                        <div className="text-[11px] text-gray-400 leading-extra-loose whitespace-pre-wrap py-2 font-medium italic space-y-3">
                                            {results.suggestions ? (
                                                Array.isArray(results.suggestions)
                                                    ? results.suggestions.map((item, i) => (
                                                        <div key={i} className="flex gap-3 bg-emerald-500/[0.02] p-2.5 rounded-lg border border-emerald-500/5">
                                                            <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))
                                                    : <div>{results.suggestions}</div>
                                            ) : 'No optimization suggestions generated.'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                    }

                    {
                        innerTab === 'rewritten' && (
                            <motion.div key="rewritten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:absolute lg:inset-0 relative w-full h-auto lg:h-full flex flex-col gap-4">
                                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                                    <div className="flex-none lg:flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col p-4 h-[350px] lg:h-auto">
                                        <div className="text-xs font-black uppercase text-gray-600 mb-3 tracking-widest">Original</div>
                                        <div className="flex-1 border border-white/5 rounded-xl overflow-hidden opacity-60 z-20">
                                            <Editor height="100%" theme="vs-dark" language={inputLanguage} value={code} options={{ readOnly: true, fontSize: 12, minimap: { enabled: false }, automaticLayout: true }} />
                                        </div>
                                    </div>
                                    <div className="flex-none lg:flex-1 glass-panel rounded-2xl border border-emerald-500/20 flex flex-col p-4 shadow-[0_0_20px_rgba(16,185,129,0.05)] h-[450px] lg:h-auto">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="text-xs font-black uppercase text-emerald-500 tracking-widest">Rewritten & Editable</div>
                                            <button
                                                onClick={() => copyToClipboard(results?.rewrittenCode || '')}
                                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                                            >
                                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                                {copied && <span className="text-[10px] font-bold">COPIED</span>}
                                            </button>
                                        </div>
                                        <div className="flex-1 border border-emerald-500/10 rounded-xl overflow-hidden">
                                            <Editor
                                                height="100%" theme="vs-dark" language={inputLanguage}
                                                value={results?.rewrittenCode || '// Paste code and hit fix...'}
                                                onChange={val => setResults(prev => prev ? { ...prev, rewrittenCode: val || '' } : null)}
                                                options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="h-32 glass-panel rounded-2xl border border-white/5 p-4 overflow-y-auto cyber-scrollbar">
                                    <div className="flex items-center gap-2 mb-2 text-yellow-500"><Zap size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Summary</span></div>
                                    <p className="text-xs text-gray-400 leading-relaxed">{results?.explanation || 'Awaiting fixes...'}</p>
                                </div>
                            </motion.div>
                        )
                    }
                    {
                        innerTab === 'how' && (
                            <motion.div key="how" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lg:absolute lg:inset-0 relative overflow-y-auto cyber-scrollbar pr-4 space-y-12">
                                {/* Logo Ticker */}
                                <section className="mt-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Supported AI Models</h2>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="relative overflow-hidden w-full flex">
                                        <motion.div
                                            animate={{ x: [0, -1035] }}
                                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                            className="flex gap-8 whitespace-nowrap shrink-0"
                                        >
                                            {[...new Array(3)].map((_, i) => (
                                                <div key={i} className="flex gap-8 shrink-0">
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
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <HowCard
                                        icon={<Search className="text-[#0ff]" />}
                                        title="AI Code Review"
                                        desc="Our engine performs a deep semantic analysis of your code, searching for syntax errors, logical bugs, and security vulnerabilities."
                                    />
                                    <HowCard
                                        icon={<PenTool className="text-emerald-400" />}
                                        title="Automatic Refactoring"
                                        desc="We don't just find errors—we fix them. Our models rewrite problematic code blocks for maximum performance and readability."
                                    />
                                    <HowCard
                                        icon={<ShieldAlert className="text-red-400" />}
                                        title="Vulnerability Detection"
                                        desc="Get alerted on insecure patterns. We check for SQL injection, hardcoded secrets, and inefficient memory usage."
                                    />
                                    <HowCard
                                        icon={<Zap className="text-yellow-400" />}
                                        title="Real-time Highlighting"
                                        desc="Issue markers are injected directly into the editor view with clickable line references and fix suggestions."
                                    />
                                    <HowCard
                                        icon={<RefreshCw className="text-[#a855f7]" />}
                                        title="Multiple LLM Support"
                                        desc="Connect Gemini, OpenAI, Grok, or any custom API provider for the best analysis results that suit your needs."
                                    />
                                    <HowCard
                                        icon={<Terminal className="text-blue-400" />}
                                        title="Clean Documentation"
                                        desc="Every fix comes with a detailed explanation of why the original code was problematic and how the improvement helps."
                                    />
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </div >
        </div >
    );
}

const HowCard = ({ icon, title, desc }: any) => (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#0ff]/20 transition-all group bg-gradient-to-br from-white/[0.02] to-transparent">
        <div className="w-12 h-12 rounded-xl bg-[#12122b] border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#0ff]/30 transition-all shadow-xl">
            {icon}
        </div>
        <h3 className="text-white font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-[11px] leading-relaxed font-medium">{desc}</p>
    </div>
);

// ── Shared UI ──
const TabButton = ({ active, onClick, icon, label, mobileLabel }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 pb-2 border-b-2 font-bold text-xs uppercase tracking-tight transition-all shrink-0 ${active ? 'border-[#0ff] text-[#0ff]' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
        {icon}
        <span className={mobileLabel ? 'hidden sm:inline' : ''}>{label}</span>
        {mobileLabel && <span className="sm:hidden">{mobileLabel}</span>}
    </button>
);

const CheckboxItem = ({ label, checked, onChange, color }: any) => (
    <label className="flex items-center gap-2 cursor-pointer group">
        <div className={`w-3.5 h-3.5 rounded border border-white/10 flex items-center justify-center transition-all ${checked ? 'bg-white/5' : ''}`}>
            {checked && <Check size={10} className={color} />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        <span className={`text-[10px] font-bold uppercase tracking-wide ${checked ? 'text-white' : 'text-gray-600'}`}>{label}</span>
    </label>
);

const ScoreCard = ({ label, count, color, border }: any) => (
    <div className={`bg-black/20 border ${border} rounded-xl py-2 flex flex-col items-center justify-center`}>
        <span className="text-[9px] font-black text-gray-700 uppercase mb-0.5">{label}</span>
        <span className={`text-base font-bold ${color}`}>{count}</span>
    </div>
);

const ErrorItem = ({ err, expanded, onToggle }: any) => {
    const sev = SEV[err.severity as keyof typeof SEV] || SEV.error;
    return (
        <div className={`rounded-xl border ${sev.border} ${sev.bg} overflow-hidden transition-all`}>
            <button onClick={onToggle} className="w-full text-left p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/40 ${sev.color} border ${sev.border}`}>LINE {err.line}</span>
                        <span className="text-xs font-bold text-gray-200 truncate pr-4">{err.message}</span>
                    </div>
                    <ChevronRight size={14} className={`text-gray-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>
                {err.code && (
                    <div className="mt-2 space-y-1">
                        <div className="text-[8px] font-black uppercase text-red-500/60 tracking-widest pl-1">Buggy Code</div>
                        <div className="bg-red-500/5 rounded px-2 py-1.5 font-mono text-[10px] text-red-300/90 border-l-2 border-red-500/40 truncate italic">
                            {err.code}
                        </div>
                    </div>
                )}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-3 pb-3">
                        <div className="pt-2 border-t border-white/5 space-y-3">
                            <div className="space-y-1">
                                <div className="text-[8px] font-black uppercase text-gray-600 tracking-widest pl-1">Error Details</div>
                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium pl-1">{err.explanation}</p>
                            </div>

                            {err.fix && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-emerald-500 tracking-widest pl-1">
                                        <Zap size={10} fill="currentColor" /> Correct Code
                                    </div>
                                    <div className="bg-emerald-500/5 border-l-2 border-emerald-500 rounded-r p-2.5 font-mono text-[11px] text-emerald-300 shadow-inner select-all">
                                        {err.fix}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LogoItem = ({ src, icon, name }: any) => (
    <div className="flex items-center gap-3 glass-panel px-4 py-2 border border-white/5 bg-white/[0.01] rounded-xl group hover:border-[#0ff]/30 transition-all">
        <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden bg-black/40">
            {src ? <img src={src} alt={name} className="w-4 h-4 object-contain opacity-50 group-hover:opacity-100 transition-opacity" /> : icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">{name}</span>
    </div>
);
