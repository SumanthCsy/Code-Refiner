import axios from 'axios';

// Project's built-in Gemini API key - fallback only
const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

// Default models when user doesn't specify
const HF_DEFAULT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const OR_DEFAULT_MODEL = "openai/gpt-3.5-turbo";

/**
 * Resolve which API config to use.
 * Priority: user's saved active key → built-in Gemini fallback
 * The `code_refiner_use_custom` flag is the source of truth for
 * whether the user has explicitly activated a custom key.
 */
const resolveKey = (): {
    key: string;
    provider: string;
    customEndpoint?: string;
    customModel?: string;
} => {
    const useCustom = localStorage.getItem('code_refiner_use_custom') === 'true';
    const storedKey = localStorage.getItem('code_refiner_api_key') || "";
    const storedProvider = localStorage.getItem('code_refiner_provider') || "gemini";
    const customEndpoint = localStorage.getItem('code_refiner_custom_endpoint') || "";
    const customModel = localStorage.getItem('code_refiner_custom_model') || "";

    // Use user's own key if they have explicitly activated one
    if (useCustom && storedKey.trim().length > 4) {
        return {
            key: storedKey.trim(),
            provider: storedProvider,
            customEndpoint: customEndpoint || undefined,
            customModel: customModel || undefined,
        };
    }

    // Fall back to project's built-in Gemini key
    return { key: DEFAULT_GEMINI_KEY, provider: "gemini" };
};

export const generateGeminiContent = async (prompt: string): Promise<string> => {
    const { key: apiKey, provider, customEndpoint, customModel } = resolveKey();

    try {
        // ── OpenAI ────────────────────────────────────────────────────────────────
        if (provider === 'openai') {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: customModel || "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                },
                { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            return response.data.choices[0].message.content;
        }

        // ── Grok (xAI) ───────────────────────────────────────────────────────────
        if (provider === 'grok') {
            const response = await axios.post(
                'https://api.x.ai/v1/chat/completions',
                {
                    model: customModel || "grok-beta",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                },
                { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            return response.data.choices[0].message.content;
        }

        // ── Hugging Face (via router — CORS-safe for browsers) ───────────────────
        if (provider === 'huggingface') {
            const model = customModel?.trim() || HF_DEFAULT_MODEL;
            // Use router.huggingface.co instead of api-inference.huggingface.co
            // The router endpoint has proper CORS headers for browser requests
            const response = await axios.post(
                'https://router.huggingface.co/v1/chat/completions',
                {
                    model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                    max_tokens: 4096,
                },
                { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            const text =
                response.data?.choices?.[0]?.message?.content ||
                response.data?.generated_text ||
                response.data?.[0]?.generated_text ||
                "// No output generated";
            return text;
        }

        // ── OpenRouter ────────────────────────────────────────────────────────────
        if (provider === 'openrouter') {
            const model = customModel?.trim() || OR_DEFAULT_MODEL;
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                { model, messages: [{ role: "user", content: prompt }], temperature: 0.2 },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'Code Refiner',
                    },
                }
            );
            return response.data.choices[0].message.content;
        }

        // ── Custom API (OpenAI-compatible) ────────────────────────────────────────
        if (provider === 'custom') {
            const endpoint = customEndpoint?.trim() || 'http://localhost:11434/v1/chat/completions';
            const model = customModel?.trim() || 'llama3';
            const response = await axios.post(
                endpoint,
                { model, messages: [{ role: "user", content: prompt }], temperature: 0.2 },
                { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
            );
            return response.data.choices[0].message.content;
        }

        // ── Gemini (default + user's own Gemini key) ──────────────────────────────
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
        const response = await axios.post(
            url,
            { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } },
            { headers: { 'Content-Type': 'application/json' } }
        );
        const candidate = response.data?.candidates?.[0];
        if (candidate) return candidate.content.parts[0].text;
        return "// No output generated";

    } catch (error: any) {
        const status = error.response?.status;
        const errorMsg: string =
            error.response?.data?.error?.message ||
            (typeof error.response?.data?.error === 'string' ? error.response?.data?.error : '') ||
            error.message ||
            "";

        if (status === 429) throw new Error("LIMIT_EXPIRED");

        // Model overloaded / high traffic
        if (
            status === 503 ||
            errorMsg.toLowerCase().includes('overloaded') ||
            errorMsg.toLowerCase().includes('unavailable') ||
            errorMsg.toLowerCase().includes('capacity') ||
            errorMsg.toLowerCase().includes('too many requests') ||
            errorMsg.toLowerCase().includes('model is currently loading')
        ) {
            throw new Error("MODEL_OVERLOADED");
        }

        // CORS / network errors have no status — give a helpful message
        if (!status && (errorMsg.includes('Network Error') || errorMsg.includes('CORS'))) {
            throw new Error(
                "Network error — likely a CORS block. " +
                "HuggingFace: use router.huggingface.co (already set). " +
                "For other providers, check your key and endpoint."
            );
        }

        console.error("API Error:", status, errorMsg);
        throw new Error(errorMsg || "API request failed");
    }
};

export const stripMarkdown = (text: string): string => {
    const match = text.match(/```[\w]*\n([\s\S]*?)```/);
    if (match && match[1]) return match[1].trim();
    return text.trim();
};
