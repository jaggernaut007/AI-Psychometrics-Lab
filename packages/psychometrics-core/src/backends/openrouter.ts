/**
 * OpenRouter LLM backend with retry logic and timeouts.
 * @author Gordon Olson, Shreyas Jagannath
 */
import type { LLMBackend } from '../types';

export interface OpenRouterConfig {
    apiKey: string;
    maxRetries?: number;
    timeoutMs?: number;
    referer?: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parseRetryAfterMs(value: string | null): number | null {
    if (!value) return null;
    const seconds = Number(value);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate)) {
        const delta = asDate - Date.now();
        return delta > 0 ? delta : 0;
    }
    return null;
}

/**
 * OpenRouter LLM backend.
 * Wraps the OpenRouter chat completions API with retry logic and timeouts.
 */
export class OpenRouterBackend implements LLMBackend {
    private apiKey: string;
    private maxRetries: number;
    private timeoutMs: number;
    private referer: string;

    constructor(config: OpenRouterConfig) {
        this.apiKey = config.apiKey;
        this.maxRetries = config.maxRetries ?? 3;
        this.timeoutMs = config.timeoutMs ?? 90_000;
        this.referer = config.referer ?? 'http://localhost:3000';
    }

    async query(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
        const messages: { role: string; content: string }[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const url = 'https://openrouter.ai/api/v1/chat/completions';
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.referer,
            'X-Title': 'AI Psychometric Profiler',
        };

        let lastError: unknown = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: '', // set externally via engine
                        messages,
                        temperature,
                        max_tokens: 150,
                    }),
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const status = response.status;
                    const errorBody = await response.text().catch(() => '');
                    const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
                    const retryable = status === 429 || status === 408 || (status >= 500 && status <= 599);

                    if (attempt < this.maxRetries && retryable) {
                        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10_000);
                        const jitterMs = Math.floor(Math.random() * 250);
                        await sleep(retryAfterMs ?? (backoffMs + jitterMs));
                        continue;
                    }

                    throw new Error(`OpenRouter API Error: ${status} - ${errorBody}`);
                }

                const data = await response.json();
                const message = data.choices?.[0]?.message;

                if (!message?.content) {
                    if (message?.reasoning) {
                        return message.reasoning;
                    }
                    return JSON.stringify(data);
                }
                return message.content;
            } catch (error: any) {
                clearTimeout(timeoutId);
                lastError = error;

                const isAbort = error?.name === 'AbortError';
                const isNetwork = error instanceof TypeError;

                if (attempt < this.maxRetries && (isAbort || isNetwork)) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10_000);
                    const jitterMs = Math.floor(Math.random() * 250);
                    await sleep(backoffMs + jitterMs);
                    continue;
                }

                throw error;
            }
        }

        throw lastError;
    }
}

/**
 * Create an OpenRouter backend that includes the model name in each request.
 * This factory wraps the backend to inject the model into the request body.
 */
export function createOpenRouterBackend(config: OpenRouterConfig & { model: string }): LLMBackend {
    const { model, ...backendConfig } = config;

    return {
        async query(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
            const messages: { role: string; content: string }[] = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });

            const maxRetries = backendConfig.maxRetries ?? 3;
            const timeoutMs = backendConfig.timeoutMs ?? 90_000;
            const referer = backendConfig.referer ?? 'http://localhost:3000';

            const url = 'https://openrouter.ai/api/v1/chat/completions';
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${backendConfig.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': referer,
                'X-Title': 'AI Psychometric Profiler',
            };

            let lastError: unknown = null;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers,
                        signal: controller.signal,
                        body: JSON.stringify({ model, messages, temperature, max_tokens: 150 }),
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const status = response.status;
                        const errorBody = await response.text().catch(() => '');
                        const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
                        const retryable = status === 429 || status === 408 || (status >= 500 && status <= 599);

                        if (attempt < maxRetries && retryable) {
                            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10_000);
                            const jitterMs = Math.floor(Math.random() * 250);
                            await sleep(retryAfterMs ?? (backoffMs + jitterMs));
                            continue;
                        }

                        throw new Error(`OpenRouter API Error: ${status} - ${errorBody}`);
                    }

                    const data = await response.json();
                    const msg = data.choices?.[0]?.message;

                    if (!msg?.content) {
                        if (msg?.reasoning) return msg.reasoning;
                        return JSON.stringify(data);
                    }
                    return msg.content;
                } catch (error: any) {
                    clearTimeout(timeoutId);
                    lastError = error;

                    const isAbort = error?.name === 'AbortError';
                    const isNetwork = error instanceof TypeError;

                    if (attempt < maxRetries && (isAbort || isNetwork)) {
                        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10_000);
                        const jitterMs = Math.floor(Math.random() * 250);
                        await sleep(backoffMs + jitterMs);
                        continue;
                    }

                    throw error;
                }
            }

            throw lastError;
        }
    };
}
