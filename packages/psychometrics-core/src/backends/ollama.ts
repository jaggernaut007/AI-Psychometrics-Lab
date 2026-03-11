/**
 * Ollama LLM backend for local model inference.
 * @author Gordon Olson, Shreyas Jagannath
 */
import type { LLMBackend } from '../types';

export interface OllamaConfig {
    baseUrl?: string;
    model: string;
    timeoutMs?: number;
}

/**
 * Ollama LLM backend for local model inference.
 * Connects to a running Ollama instance at the specified base URL.
 */
export class OllamaBackend implements LLMBackend {
    private baseUrl: string;
    private model: string;
    private timeoutMs: number;

    constructor(config: OllamaConfig) {
        this.baseUrl = (config.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
        this.model = config.model;
        this.timeoutMs = config.timeoutMs ?? 120_000; // local models can be slower
    }

    async query(prompt: string, systemPrompt: string, temperature: number): Promise<string> {
        const messages: { role: string; content: string }[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: false,
                    options: { temperature },
                }),
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new Error(`Ollama API Error: ${response.status} - ${errorBody}`);
            }

            const data = await response.json();
            return data.message?.content ?? '';
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error?.name === 'AbortError') {
                throw new Error(`Ollama request timed out after ${this.timeoutMs}ms`);
            }

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(
                    `Cannot connect to Ollama at ${this.baseUrl}. ` +
                    'Make sure Ollama is running (ollama serve) and the model is pulled.'
                );
            }

            throw error;
        }
    }

    /**
     * Check if Ollama is reachable and the model is available.
     */
    async healthCheck(): Promise<{ ok: boolean; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return { ok: false, error: `Ollama returned ${response.status}` };
            }
            const data = await response.json();
            const models = data.models?.map((m: any) => m.name) ?? [];
            const modelBase = this.model.split(':')[0];
            const found = models.some((m: string) => m.startsWith(modelBase));
            if (!found) {
                return {
                    ok: false,
                    error: `Model "${this.model}" not found. Available: ${models.join(', ')}. Run: ollama pull ${this.model}`
                };
            }
            return { ok: true };
        } catch {
            return { ok: false, error: `Cannot connect to Ollama at ${this.baseUrl}` };
        }
    }
}
