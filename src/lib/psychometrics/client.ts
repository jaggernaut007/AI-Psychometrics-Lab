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

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": referer, // Optional
                "X-Title": "AI Psychometric Profiler", // Optional
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            console.warn("Empty or missing content in response:", data);
            // Return the full JSON so we can see it in the UI logs
            return JSON.stringify(data);
        }
        return data.choices[0]?.message?.content;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
}
