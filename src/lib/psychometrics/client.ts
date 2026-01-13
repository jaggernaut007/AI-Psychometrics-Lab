export async function fetchOpenRouterResponse(
    apiKey: string,
    model: string,
    prompt: string,
    temperature: number = 0.7,
    systemPrompt: string = ""
): Promise<string> {
    try {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: "system", content: systemPrompt });
        }
        messages.push({ role: "user", content: prompt });

        const referer = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

        const url = "https://openrouter.ai/api/v1/chat/completions";
        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": referer,
            "X-Title": "AI Psychometric Profiler",
        };

        const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        const parseRetryAfterMs = (value: string | null): number | null => {
            if (!value) return null;
            const seconds = Number(value);
            if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
            const asDate = Date.parse(value);
            if (!Number.isNaN(asDate)) {
                const delta = asDate - Date.now();
                return delta > 0 ? delta : 0;
            }
            return null;
        };

        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 90_000;

        let lastError: unknown = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers,
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        temperature: temperature,
                        max_tokens: 4096,
                    }),
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const status = response.status;
                    const errorBody = await response.text().catch(() => "");
                    const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
                    const retryable = status === 429 || status === 408 || (status >= 500 && status <= 599);

                    if (attempt < MAX_RETRIES && retryable) {
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
                    // Check for reasoning field (common in thinking models like Gemini 2.0/3.0)
                    if (message?.reasoning) {
                        console.log("Content empty, using reasoning field as fallback response.");
                        return message.reasoning;
                    }

                    console.warn("Empty or missing content in response:", data);
                    return JSON.stringify(data);
                }
                return message.content;
            } catch (error: any) {
                clearTimeout(timeoutId);
                lastError = error;

                const isAbort = error?.name === 'AbortError';
                const isNetwork = error instanceof TypeError;

                if (attempt < MAX_RETRIES && (isAbort || isNetwork)) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10_000);
                    const jitterMs = Math.floor(Math.random() * 250);
                    await sleep(backoffMs + jitterMs);
                    continue;
                }

                throw error;
            }
        }

        throw lastError;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
}
