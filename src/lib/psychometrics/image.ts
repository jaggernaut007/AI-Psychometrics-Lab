import { ModelProfile } from './types';

export async function generateSummaryImage(apiKey: string, profile: ModelProfile): Promise<string> {
    const modelName = profile.modelName;

    // Construct Prompt with Strict Layout Instructions
    let prompt = `Create a high-contrast, professional data dashboard image for an AI model named "${modelName}".
    
    STRICT LAYOUT & TEXT RULES:
    1. HEADER (Top Right): Display "${modelName}" in large, crisp, white text.
    2. LAYOUT: Organize the data into three distinct, vertical columns or panels.
    
    COLUMN 1: BIG FIVE (Ocean Traits)
    Render exactly these values:
    `;

    // Add Big Five
    if (profile.results['bigfive']) {
        const scores = profile.results['bigfive'].traitScores;
        prompt += `
        - Openness: ${Math.round(scores.O)}/120
        - Conscientiousness: ${Math.round(scores.C)}/120
        - Extraversion: ${Math.round(scores.E)}/120
        - Agreeableness: ${Math.round(scores.A)}/120
        - Neuroticism: ${Math.round(scores.N)}/120`;
    }

    // Add MBTI
    if (profile.results['mbti_derived'] || profile.results['mbti']) {
        const mbti = profile.results['mbti_derived'] || profile.results['mbti'];
        prompt += `
        
        COLUMN 2: MBTI TYPE
        Display this EXACT text in a large, central badge:
        "${mbti.type}"
        `;
    }

    // Add DISC
    if (profile.results['disc']) {
        const disc = profile.results['disc'].traitScores;
        prompt += `
        
        COLUMN 3: DISC PROFILE
        Render these exact scores:
        - Dominance (D): ${disc.D}
        - Influence (I): ${disc.I}
        - Steadiness (S): ${disc.S}
        - Conscientiousness (C): ${disc.C}`;
    }

    prompt += `
    
    VISUAL STYLE:
    - Background: Deep matte black or dark slate grey (#1a1a1a).
    - Text: Bright white or cyan for high readability. Sans-serif font.
    - Graphics: Minimalist data bars or radar charts. NO messy neon glow that obscures text.
    - ACCURACY: You MUST render the text values exactly as listed above. Do not hallucinate different numbers or types.
    `;

    try {
        const referer = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        // OpenRouter uses chat/completions for image generation with specific models
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": referer,
                "X-Title": "AI Psychometric Profiler",
            },
            body: JSON.stringify({
                model: process.env.NEXT_PUBLIC_IMAGE_MODEL || "black-forest-labs/flux.2-pro",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                // OpenRouter specific: request image generation
                // Search results indicate we need to specify modalities
                // Some docs say ["image", "text"], others just ["image"]. 
                // We'll try ["image", "text"] as per search result.
                // Note: This parameter might need to be 'provider: { require_parameters: true }' or similar if ignored,
                // but usually top-level works for OpenRouter extensions.
                // Actually, OpenRouter docs often put these in 'provider' or top level.
                // Let's try top level first.
                // If this fails, we might need to check if the model ID is actually 'black-forest-labs/flux-1.1-pro'
                provider: {
                    require_parameters: true
                },
                // Some models require this at top level
                // modalities: ["image", "text"], // This might be for specific endpoints
                // But for OpenRouter standard chat/completions, it's often inferred or passed differently.
                // Wait, search result said: "specify modalities: ['image', 'text'] in your API request"
                // Let's put it at top level.
                modalities: ["image", "text"],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("OpenRouter API Error Body:", errorBody);
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        console.log("Image Generation Response Data:", JSON.stringify(data, null, 2));

        // Strategy 1: Check for standard OpenAI Image API format (data[0].url)
        // Even though we called chat/completions, some providers might map it this way?
        if (data.data && Array.isArray(data.data) && data.data.length > 0 && data.data[0].url) {
            return data.data[0].url;
        }

        // Strategy 2: Check for Chat Completion content
        const choice = data.choices?.[0];
        const message = choice?.message;
        const content = message?.content;

        if (content) {
            // Check for Markdown image syntax: ![alt](url)
            const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);
            if (markdownMatch && markdownMatch[1]) {
                return markdownMatch[1];
            }

            // Check for raw URL (http...)
            const urlMatch = content.match(/(https?:\/\/[^\s)]+)/);
            if (urlMatch && urlMatch[1]) {
                return urlMatch[1];
            }

            // If content is a base64 data URL
            if (content.startsWith('data:image')) {
                return content;
            }

            // If content is just a URL string
            if (content.startsWith('http')) {
                return content;
            }
        }

        // Strategy 3: Check for non-standard fields in message or choice
        // Some providers might put the url directly in the message object
        if (message?.url) return message.url;
        if (message?.image) return message.image;
        if (choice?.url) return choice.url;
        if (choice?.image) return choice.image;

        // Strategy 3.5: Check for Flux/OpenRouter specific 'images' array in message
        // Structure seen: choices[0].message.images[0].image_url.url
        if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
            const imgObj = message.images[0];
            if (imgObj.image_url?.url) return imgObj.image_url.url;
            if (imgObj.url) return imgObj.url;
            if (typeof imgObj === 'string') return imgObj;
        }

        // Strategy 4: Check for 'images' array in response
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return data.images[0];
        }

        // If we get here, we couldn't find the image.
        // Throw an error WITH the JSON data so the user can see it.
        throw new Error("Could not find image URL in response. Raw Data: " + JSON.stringify(data));

    } catch (error) {
        console.error("Image Generation Failed:", error);
        throw error;
    }
}
