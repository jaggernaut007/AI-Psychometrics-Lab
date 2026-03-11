import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaBackend } from '../src/backends/ollama';

describe('OllamaBackend', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('constructs with default config', () => {
        const backend = new OllamaBackend({ model: 'llama3.2' });
        expect(backend).toBeDefined();
    });

    it('sends correct request format', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({
                message: { content: '3' },
            }),
        };
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const backend = new OllamaBackend({ model: 'llama3.2', baseUrl: 'http://localhost:11434' });
        const result = await backend.query('Rate this statement', 'You are helpful', 0.7);

        expect(result).toBe('3');
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:11434/api/chat',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"model":"llama3.2"'),
            })
        );

        // Verify message structure
        const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(body.messages).toHaveLength(2);
        expect(body.messages[0].role).toBe('system');
        expect(body.messages[1].role).toBe('user');
        expect(body.stream).toBe(false);
    });

    it('omits system message when empty', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ message: { content: '4' } }),
        };
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const backend = new OllamaBackend({ model: 'llama3.2' });
        await backend.query('Test prompt', '', 0.5);

        const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(body.messages).toHaveLength(1);
        expect(body.messages[0].role).toBe('user');
    });

    it('throws on API errors', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
        };
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const backend = new OllamaBackend({ model: 'llama3.2' });
        await expect(backend.query('test', '', 0.7)).rejects.toThrow('Ollama API Error: 500');
    });

    it('handles connection errors with helpful message', async () => {
        global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

        const backend = new OllamaBackend({ model: 'llama3.2' });
        await expect(backend.query('test', '', 0.7)).rejects.toThrow('Cannot connect to Ollama');
    });

    describe('healthCheck', () => {
        it('returns ok when model is available', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    models: [{ name: 'llama3.2:latest' }, { name: 'mistral:latest' }],
                }),
            });

            const backend = new OllamaBackend({ model: 'llama3.2' });
            const result = await backend.healthCheck();
            expect(result.ok).toBe(true);
        });

        it('returns error when model not found', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    models: [{ name: 'mistral:latest' }],
                }),
            });

            const backend = new OllamaBackend({ model: 'llama3.2' });
            const result = await backend.healthCheck();
            expect(result.ok).toBe(false);
            expect(result.error).toContain('not found');
            expect(result.error).toContain('ollama pull');
        });

        it('returns error when Ollama is unreachable', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

            const backend = new OllamaBackend({ model: 'llama3.2' });
            const result = await backend.healthCheck();
            expect(result.ok).toBe(false);
            expect(result.error).toContain('Cannot connect');
        });
    });
});
