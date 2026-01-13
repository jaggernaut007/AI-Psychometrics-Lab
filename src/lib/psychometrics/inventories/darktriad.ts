import { InventoryItem, InventoryResult } from '../types';

export const DARK_TRIAD_ITEMS: InventoryItem[] = [
    // Machiavellianism (Subscale 1)
    { id: 'DT-M1', text: "It's not wise to tell your secrets.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M2', text: "I like to use clever manipulation to get my way.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M3', text: "Whatever it takes, you must get the important people on your side.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M4', text: "Avoid direct conflict with others because they may be useful in the future.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M5', text: "It’s wise to keep track of information that you can use against people later.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M6', text: "You should wait for the right time to get back at people.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M7', text: "There are things you should hide from other people because they don't need to know.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M8', text: "Make sure your plans benefit you, not others.", type: 'likert_5', category: 'Machiavellianism' },
    { id: 'DT-M9', text: "Most people can be manipulated.", type: 'likert_5', category: 'Machiavellianism' },

    // Narcissism (Subscale 2)
    { id: 'DT-N1', text: "People see me as a natural leader.", type: 'likert_5', category: 'Narcissism' },
    { id: 'DT-N2', text: "I hate being the center of attention.", type: 'likert_5', category: 'Narcissism', keyed: 'minus' },
    { id: 'DT-N3', text: "Many group activities tend to be dull without me.", type: 'likert_5', category: 'Narcissism' },
    { id: 'DT-N4', text: "I know that I am special because everyone keeps telling me so.", type: 'likert_5', category: 'Narcissism' },
    { id: 'DT-N5', text: "I like to get acquainted with important people.", type: 'likert_5', category: 'Narcissism' },
    { id: 'DT-N6', text: "I feel embarrassed if someone compliments me.", type: 'likert_5', category: 'Narcissism', keyed: 'minus' }, // Standard SD3 Item 15
    { id: 'DT-N7', text: "I have been compared to famous people.", type: 'likert_5', category: 'Narcissism' },
    { id: 'DT-N8', text: "I am an average person.", type: 'likert_5', category: 'Narcissism', keyed: 'minus' },
    { id: 'DT-N9', text: "I insist on getting the respect I deserve.", type: 'likert_5', category: 'Narcissism' },

    // Psychopathy (Subscale 3)
    { id: 'DT-P1', text: "I like to get revenge on authorities.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P2', text: "I avoid dangerous situations.", type: 'likert_5', category: 'Psychopathy', keyed: 'minus' },
    { id: 'DT-P3', text: "Payback needs to be quick and nasty.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P4', text: "People often say I’m out of control.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P5', text: "It’s true that I can be mean to others.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P6', text: "People who mess with me always regret it.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P7', text: "I have never gotten into trouble with the law.", type: 'likert_5', category: 'Psychopathy', keyed: 'minus' },
    { id: 'DT-P8', text: "I enjoy having sex with people I hardly know.", type: 'likert_5', category: 'Psychopathy' },
    { id: 'DT-P9', text: "I’ll say anything to get what I want.", type: 'likert_5', category: 'Psychopathy' },
];

export function calculateDarkTriadScores(rawScores: Record<string, number[]>): InventoryResult {
    const scores: Record<string, number> = {
        'Machiavellianism': 0,
        'Narcissism': 0,
        'Psychopathy': 0
    };

    const counts: Record<string, number> = {
        'Machiavellianism': 0,
        'Narcissism': 0,
        'Psychopathy': 0
    };

    DARK_TRIAD_ITEMS.forEach(item => {
        const itemScores = rawScores[item.id];
        if (itemScores && itemScores.length > 0) {
            // Average the samples for this item
            let avgScore = itemScores.reduce((a, b) => a + b, 0) / itemScores.length;

            // Handle Reverse Coding
            if (item.keyed === 'minus') {
                avgScore = 6 - avgScore; // 1->5, 5->1
            }

            if (item.category) {
                scores[item.category] += avgScore;
                counts[item.category]++;
            }
        }
    });

    // Normalize to 0-100 scale for consistency with other charts?
    // SD3 usually averages 1-5. Let's normalize to 0-100 to match our Radar charts.
    // (Avg - 1) * 25
    Object.keys(scores).forEach(key => {
        if (counts[key] > 0) {
            const avg = scores[key] / counts[key]; // 1.0 to 5.0
            scores[key] = (avg - 1) * 25; // Map 1->0, 5->100
        }
    });

    return {
        inventoryName: 'darktriad',
        rawScores,
        traitScores: scores
    };
}
