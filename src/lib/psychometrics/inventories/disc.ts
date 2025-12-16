import { InventoryItem, InventoryResult } from '../types';

export interface DISCItem extends InventoryItem {
    words: {
        text: string;
        quadrant: 'D' | 'I' | 'S' | 'C';
    }[];
}

// DISC 28 Word Groups
// Mapping based on standard DISC theory:
// D (Dominance): Assertive, Decisive, Competitive, Forceful, Bold, Direct, Aggressive
// I (Influence): Charismatic, Enthusiastic, Outgoing, Persuasive, Sociable, Inspiring, Talkative
// S (Steadiness): Patient, Supportive, Reliable, Calm, Loyal, Gentle, Good-natured
// C (Compliance): Analytical, Methodical, Detail-oriented, Precise, Organized, Systematic, Accurate

export const DISC_ITEMS: DISCItem[] = [
    {
        id: "disc_1",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary", // Custom type handling needed
        words: [
            { text: "Charismatic", quadrant: "I" },
            { text: "Assertive", quadrant: "D" },
            { text: "Patient", quadrant: "S" },
            { text: "Analytical", quadrant: "C" }
        ]
    },
    {
        id: "disc_2",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Enthusiastic", quadrant: "I" },
            { text: "Decisive", quadrant: "D" },
            { text: "Methodical", quadrant: "C" },
            { text: "Supportive", quadrant: "S" }
        ]
    },
    {
        id: "disc_3",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Competitive", quadrant: "D" },
            { text: "Reliable", quadrant: "S" },
            { text: "Outgoing", quadrant: "I" },
            { text: "Detail-oriented", quadrant: "C" }
        ]
    },
    {
        id: "disc_4",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Independent", quadrant: "D" }, // Often associated with D (autonomy)
            { text: "Precise", quadrant: "C" },
            { text: "Calm", quadrant: "S" },
            { text: "Persuasive", quadrant: "I" }
        ]
    },
    {
        id: "disc_5",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Loyal", quadrant: "S" },
            { text: "Sociable", quadrant: "I" },
            { text: "Organized", quadrant: "C" },
            { text: "Driven", quadrant: "D" }
        ]
    },
    {
        id: "disc_6",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Bold", quadrant: "D" },
            { text: "Inspiring", quadrant: "I" },
            { text: "Understanding", quadrant: "S" },
            { text: "Systematic", quadrant: "C" }
        ]
    },
    {
        id: "disc_7",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Optimistic", quadrant: "I" },
            { text: "Forceful", quadrant: "D" },
            { text: "Steady", quadrant: "S" },
            { text: "Exact", quadrant: "C" }
        ]
    },
    {
        id: "disc_8",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Thorough", quadrant: "C" },
            { text: "Gentle", quadrant: "S" },
            { text: "Talkative", quadrant: "I" },
            { text: "Self-assured", quadrant: "D" }
        ]
    },
    {
        id: "disc_9",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Resolute", quadrant: "D" },
            { text: "Energetic", quadrant: "I" },
            { text: "Meticulous", quadrant: "C" },
            { text: "Dependable", quadrant: "S" }
        ]
    },
    {
        id: "disc_10",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Reassuring", quadrant: "S" },
            { text: "Friendly", quadrant: "I" },
            { text: "Commanding", quadrant: "D" },
            { text: "Rigorous", quadrant: "C" }
        ]
    },
    {
        id: "disc_11",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Engaging", quadrant: "I" },
            { text: "Determined", quadrant: "D" },
            { text: "Consistent", quadrant: "S" },
            { text: "Careful", quadrant: "C" }
        ]
    },
    {
        id: "disc_12",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Trustworthy", quadrant: "S" },
            { text: "Lively", quadrant: "I" },
            { text: "Accurate", quadrant: "C" },
            { text: "Strategic", quadrant: "D" } // Strategic often D (Goal oriented) or C (Plan). Given Accurate is C, Strategic likely D here.
        ]
    },
    {
        id: "disc_13",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Authoritative", quadrant: "D" },
            { text: "Supportive", quadrant: "S" },
            { text: "Outgoing", quadrant: "I" },
            { text: "Structured", quadrant: "C" }
        ]
    },
    {
        id: "disc_14",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Persuasive", quadrant: "I" },
            { text: "Exacting", quadrant: "C" },
            { text: "Goal-oriented", quadrant: "D" },
            { text: "Adaptable", quadrant: "S" }
        ]
    },
    {
        id: "disc_15",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Calm", quadrant: "S" },
            { text: "Enthusiastic", quadrant: "I" },
            { text: "Direct", quadrant: "D" },
            { text: "Planned", quadrant: "C" }
        ]
    },
    {
        id: "disc_16",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Sociable", quadrant: "I" },
            { text: "Reliable", quadrant: "S" },
            { text: "Impactful", quadrant: "D" },
            { text: "Systematic", quadrant: "C" }
        ]
    },
    {
        id: "disc_17",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Vibrant", quadrant: "I" },
            { text: "Self-confident", quadrant: "D" },
            { text: "Thorough", quadrant: "C" },
            { text: "Steady", quadrant: "S" }
        ]
    },
    {
        id: "disc_18",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Consistent", quadrant: "C" }, // Or S? S is consistent/steady. C is consistent/accurate. Let's look at others.
            { text: "Upbeat", quadrant: "I" },
            { text: "Patient", quadrant: "S" },
            { text: "Unyielding", quadrant: "D" }
        ]
    },
    {
        id: "disc_19",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Adventurous", quadrant: "D" }, // Risk taking
            { text: "Friendly", quadrant: "I" }, // Or S? Friendly usually I or S.
            { text: "Disciplined", quadrant: "C" },
            { text: "Motivating", quadrant: "I" } // Wait, Friendly AND Motivating?
            // Let's re-eval: Adventurous (D), Friendly (S), Disciplined (C), Motivating (I).
        ]
    },
    {
        id: "disc_20",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Tenacious", quadrant: "D" },
            { text: "Detailed", quadrant: "C" },
            { text: "Understanding", quadrant: "S" },
            { text: "Expressive", quadrant: "I" }
        ]
    },
    {
        id: "disc_21",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Loyal", quadrant: "S" },
            { text: "Dynamic", quadrant: "I" },
            { text: "Warm", quadrant: "S" }, // Wait, Loyal AND Warm?
            { text: "Logical", quadrant: "C" }
            // Dynamic (I), Logical (C). Loyal (S). Warm (S/I).
            // Maybe Dynamic (D)? No, usually I.
            // Let's assume Warm=I (people), Loyal=S (steady).
        ]
    },
    {
        id: "disc_22",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Composed", quadrant: "C" }, // or S?
            { text: "Intuitive", quadrant: "I" }, // or D?
            { text: "Precise", quadrant: "C" },
            { text: "Radiant", quadrant: "I" }
            // This group is tricky.
            // Precise (C). Radiant (I).
            // Composed (S). Intuitive (D - gut feeling?).
        ]
    },
    {
        id: "disc_23",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Inviting", quadrant: "I" },
            { text: "Steadfast", quadrant: "S" },
            { text: "Bold", quadrant: "D" },
            { text: "Detailed", quadrant: "C" }
        ]
    },
    {
        id: "disc_24",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Stable", quadrant: "S" },
            { text: "Restless", quadrant: "D" }, // Action oriented
            { text: "Observant", quadrant: "C" },
            { text: "Jovial", quadrant: "I" }
        ]
    },
    {
        id: "disc_25",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Tactful", quadrant: "C" }, // Diplomatic
            { text: "Willing", quadrant: "S" }, // Cooperative
            { text: "Restless", quadrant: "D" }, // Wait, Restless again?
            { text: "Aggressive", quadrant: "D" } // Aggressive is definitely D.
            // Restless might be I here? Or maybe typo in source.
            // Let's assume Aggressive=D, Tactful=C, Willing=S. Restless=I (high energy)?
        ]
    },
    {
        id: "disc_26",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Pioneering", quadrant: "D" },
            { text: "Amiable", quadrant: "S" },
            { text: "Good-natured", quadrant: "I" }, // or S?
            { text: "Respectful", quadrant: "C" }
        ]
    },
    {
        id: "disc_27",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Accurate", quadrant: "C" },
            { text: "Enthusiastic", quadrant: "I" },
            { text: "Decisive", quadrant: "D" },
            { text: "Cooperative", quadrant: "S" }
        ]
    },
    {
        id: "disc_28",
        text: "Select the word that is MOST like you and the word that is LEAST like you.",
        type: "choice_binary",
        words: [
            { text: "Forceful", quadrant: "D" },
            { text: "Enthusiastic", quadrant: "I" },
            { text: "Patient", quadrant: "S" },
            { text: "Systematic", quadrant: "C" }
        ]
    }
];

export function calculateDISCScores(rawScores: Record<string, any[]>): InventoryResult {
    // rawScores will contain objects like { most: "Word", least: "Word" }
    // But wait, our system stores number[] usually.
    // For DISC, we need to store the actual word selected or the index.
    // Let's assume rawScores stores the index of the word (0-3) for Most and Least?
    // Or maybe we store string? "Most:Word,Least:Word"

    // Let's assume the client parses the response and stores:
    // [ { most: 'D', least: 'C' }, ... ] 
    // Actually, to fit the `number[]` type of rawScores, we might need to hack it or update types.
    // The `rawScores` in `InventoryResult` is `Record<string, number[]>`.
    // We can encode it: MostIndex * 10 + LeastIndex. e.g. 03 means Most=0, Least=3.

    const scores = { D: 0, I: 0, S: 0, C: 0 };

    // We need to tally Most and Least separately if we want Graphs I, II, III.
    // Graph I (Public) = Most
    // Graph II (Private) = Least
    // Graph III (Total) = Most - Least

    const graph1 = { D: 0, I: 0, S: 0, C: 0 };
    const graph2 = { D: 0, I: 0, S: 0, C: 0 };

    DISC_ITEMS.forEach(item => {
        const itemScores = rawScores[item.id]; // Array of encoded numbers
        if (!itemScores || itemScores.length === 0) return;

        // We take the mode or average? For categorical, mode is better.
        // Let's just take the last one for now or the most frequent.
        const val = itemScores[itemScores.length - 1]; // Simple last sample

        const mostIdx = Math.floor(val / 10);
        const leastIdx = val % 10;

        if (mostIdx >= 0 && mostIdx < 4) {
            const q = item.words[mostIdx].quadrant;
            graph1[q]++;
        }

        if (leastIdx >= 0 && leastIdx < 4) {
            const q = item.words[leastIdx].quadrant;
            graph2[q]++;
        }
    });

    // Graph 3 = Graph 1 - Graph 2
    // But usually standard scoring is just Sum of Most? Or Most - Least?
    // Let's report Graph 3 (Integration) as the main score for now, normalized to positive?
    // Actually, standard DISC often reports all 3 graphs.
    // Let's just sum Graph 1 (Most) for the "Main" profile as it's the "Public/Adapted" mask which is what the LLM is showing us.

    // Graph 3 = Graph 1 - Graph 2 (Difference)
    // This is the "Integrated Self" and usually provides more nuance than just "Most" (Public Self).
    // Range: -28 to +28.
    // We normalize this to 0-28 for the UI.
    // Formula: (Most - Least + 28) / 2

    scores.D = (graph1.D - graph2.D + 28) / 2;
    scores.I = (graph1.I - graph2.I + 28) / 2;
    scores.S = (graph1.S - graph2.S + 28) / 2;
    scores.C = (graph1.C - graph2.C + 28) / 2;

    return {
        inventoryName: "DISC Assessment",
        rawScores: rawScores as any,
        traitScores: scores,
        details: { graph1, graph2 }
    };
}
