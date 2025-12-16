import { InventoryItem, InventoryResult } from '../types';

export const BIG_FIVE_ITEMS: InventoryItem[] = [
    { id: "1", text: "Worry about things", keyed: "plus", category: "N1", type: "likert_5" },
    { id: "2", text: "Make friends easily", keyed: "plus", category: "E1", type: "likert_5" },
    { id: "3", text: "Have a vivid imagination", keyed: "plus", category: "O1", type: "likert_5" },
    { id: "4", text: "Trust others", keyed: "plus", category: "A1", type: "likert_5" },
    { id: "5", text: "Complete tasks successfully", keyed: "plus", category: "C1", type: "likert_5" },
    { id: "6", text: "Get angry easily", keyed: "plus", category: "N2", type: "likert_5" },
    { id: "7", text: "Love large parties", keyed: "plus", category: "E2", type: "likert_5" },
    { id: "8", text: "Believe in the importance of art", keyed: "plus", category: "O2", type: "likert_5" },
    { id: "9", text: "Use others for my own ends", keyed: "minus", category: "A2", type: "likert_5" },
    { id: "10", text: "Like to tidy up", keyed: "plus", category: "C2", type: "likert_5" },
    { id: "11", text: "Often feel blue", keyed: "plus", category: "N3", type: "likert_5" },
    { id: "12", text: "Take charge", keyed: "plus", category: "E3", type: "likert_5" },
    { id: "13", text: "Experience my emotions intensely", keyed: "plus", category: "O3", type: "likert_5" },
    { id: "14", text: "Love to help others", keyed: "plus", category: "A3", type: "likert_5" },
    { id: "15", text: "Keep my promises", keyed: "plus", category: "C3", type: "likert_5" },
    { id: "16", text: "Find it difficult to approach others", keyed: "plus", category: "N4", type: "likert_5" },
    { id: "17", text: "Am always busy", keyed: "plus", category: "E4", type: "likert_5" },
    { id: "18", text: "Prefer variety to routine", keyed: "plus", category: "O4", type: "likert_5" },
    { id: "19", text: "Love a good fight", keyed: "minus", category: "A4", type: "likert_5" },
    { id: "20", text: "Work hard", keyed: "plus", category: "C4", type: "likert_5" },
    { id: "21", text: "Go on binges", keyed: "plus", category: "N5", type: "likert_5" },
    { id: "22", text: "Love excitement", keyed: "plus", category: "E5", type: "likert_5" },
    { id: "23", text: "Love to read challenging material", keyed: "plus", category: "O5", type: "likert_5" },
    { id: "24", text: "Believe that I am better than others", keyed: "minus", category: "A5", type: "likert_5" },
    { id: "25", text: "Am always prepared", keyed: "plus", category: "C5", type: "likert_5" },
    { id: "26", text: "Panic easily", keyed: "plus", category: "N6", type: "likert_5" },
    { id: "27", text: "Radiate joy", keyed: "plus", category: "E6", type: "likert_5" },
    { id: "28", text: "Tend to vote for liberal political candidates", keyed: "plus", category: "O6", type: "likert_5" },
    { id: "29", text: "Sympathize with the homeless", keyed: "plus", category: "A6", type: "likert_5" },
    { id: "30", text: "Jump into things without thinking", keyed: "minus", category: "C6", type: "likert_5" },
    { id: "31", text: "Fear for the worst", keyed: "plus", category: "N1", type: "likert_5" },
    { id: "32", text: "Feel comfortable around people", keyed: "plus", category: "E1", type: "likert_5" },
    { id: "33", text: "Enjoy wild flights of fantasy", keyed: "plus", category: "O1", type: "likert_5" },
    { id: "34", text: "Believe that others have good intentions", keyed: "plus", category: "A1", type: "likert_5" },
    { id: "35", text: "Excel in what I do", keyed: "plus", category: "C1", type: "likert_5" },
    { id: "36", text: "Get irritated easily", keyed: "plus", category: "N2", type: "likert_5" },
    { id: "37", text: "Talk to a lot of different people at parties", keyed: "plus", category: "E2", type: "likert_5" },
    { id: "38", text: "See beauty in things that others might not notice", keyed: "plus", category: "O2", type: "likert_5" },
    { id: "39", text: "Cheat to get ahead", keyed: "minus", category: "A2", type: "likert_5" },
    { id: "40", text: "Often forget to put things back in their proper place", keyed: "minus", category: "C2", type: "likert_5" },
    { id: "41", text: "Dislike myself", keyed: "plus", category: "N3", type: "likert_5" },
    { id: "42", text: "Try to lead others", keyed: "plus", category: "E3", type: "likert_5" },
    { id: "43", text: "Feel others' emotions", keyed: "plus", category: "O3", type: "likert_5" },
    { id: "44", text: "Am concerned about others", keyed: "plus", category: "A3", type: "likert_5" },
    { id: "45", text: "Tell the truth", keyed: "plus", category: "C3", type: "likert_5" },
    { id: "46", text: "Am afraid to draw attention to myself", keyed: "plus", category: "N4", type: "likert_5" },
    { id: "47", text: "Am always on the go", keyed: "plus", category: "E4", type: "likert_5" },
    { id: "48", text: "Prefer to stick with things that I know", keyed: "minus", category: "O4", type: "likert_5" },
    { id: "49", text: "Yell at people", keyed: "minus", category: "A4", type: "likert_5" },
    { id: "50", text: "Do more than what's expected of me", keyed: "plus", category: "C4", type: "likert_5" },
    { id: "51", text: "Rarely overindulge", keyed: "minus", category: "N5", type: "likert_5" },
    { id: "52", text: "Seek adventure", keyed: "plus", category: "E5", type: "likert_5" },
    { id: "53", text: "Avoid philosophical discussions", keyed: "minus", category: "O5", type: "likert_5" },
    { id: "54", text: "Think highly of myself", keyed: "minus", category: "A5", type: "likert_5" },
    { id: "55", text: "Carry out my plans", keyed: "plus", category: "C5", type: "likert_5" },
    { id: "56", text: "Become overwhelmed by events", keyed: "plus", category: "N6", type: "likert_5" },
    { id: "57", text: "Have a lot of fun", keyed: "plus", category: "E6", type: "likert_5" },
    { id: "58", text: "Believe that there is no absolute right and wrong", keyed: "plus", category: "O6", type: "likert_5" },
    { id: "59", text: "Feel sympathy for those who are worse off than myself", keyed: "plus", category: "A6", type: "likert_5" },
    { id: "60", text: "Make rash decisions", keyed: "minus", category: "C6", type: "likert_5" },
    { id: "61", text: "Am afraid of many things", keyed: "plus", category: "N1", type: "likert_5" },
    { id: "62", text: "Avoid contacts with others", keyed: "minus", category: "E1", type: "likert_5" },
    { id: "63", text: "Love to daydream", keyed: "plus", category: "O1", type: "likert_5" },
    { id: "64", text: "Trust what people say", keyed: "plus", category: "A1", type: "likert_5" },
    { id: "65", text: "Handle tasks smoothly", keyed: "plus", category: "C1", type: "likert_5" },
    { id: "66", text: "Lose my temper", keyed: "plus", category: "N2", type: "likert_5" },
    { id: "67", text: "Prefer to be alone", keyed: "minus", category: "E2", type: "likert_5" },
    { id: "68", text: "Do not enjoy going to art museums", keyed: "minus", category: "O2", type: "likert_5" },
    { id: "69", text: "Take advantage of others", keyed: "minus", category: "A2", type: "likert_5" },
    { id: "70", text: "Leave a mess in my room", keyed: "minus", category: "C2", type: "likert_5" },
    { id: "71", text: "Am often down in the dumps", keyed: "plus", category: "N3", type: "likert_5" },
    { id: "72", text: "Take control of things", keyed: "plus", category: "E3", type: "likert_5" },
    { id: "73", text: "Rarely notice my emotional reactions", keyed: "minus", category: "O3", type: "likert_5" },
    { id: "74", text: "Am indifferent to the feelings of others", keyed: "minus", category: "A3", type: "likert_5" },
    { id: "75", text: "Break rules", keyed: "minus", category: "C3", type: "likert_5" },
    { id: "76", text: "Only feel comfortable with friends", keyed: "plus", category: "N4", type: "likert_5" },
    { id: "77", text: "Do a lot in my spare time", keyed: "plus", category: "E4", type: "likert_5" },
    { id: "78", text: "Dislike changes", keyed: "minus", category: "O4", type: "likert_5" },
    { id: "79", text: "Insult people", keyed: "minus", category: "A4", type: "likert_5" },
    { id: "80", text: "Do just enough work to get by", keyed: "minus", category: "C4", type: "likert_5" },
    { id: "81", text: "Easily resist temptations", keyed: "minus", category: "N5", type: "likert_5" },
    { id: "82", text: "Enjoy being reckless", keyed: "plus", category: "E5", type: "likert_5" },
    { id: "83", text: "Have difficulty understanding abstract ideas", keyed: "minus", category: "O5", type: "likert_5" },
    { id: "84", text: "Have a high opinion of myself", keyed: "minus", category: "A5", type: "likert_5" },
    { id: "85", text: "Waste my time", keyed: "minus", category: "C5", type: "likert_5" },
    { id: "86", text: "Feel that I'm unable to deal with things", keyed: "plus", category: "N6", type: "likert_5" },
    { id: "87", text: "Love life", keyed: "plus", category: "E6", type: "likert_5" },
    { id: "88", text: "Tend to vote for conservative political candidates", keyed: "minus", category: "O6", type: "likert_5" },
    { id: "89", text: "Am not interested in other people's problems", keyed: "minus", category: "A6", type: "likert_5" },
    { id: "90", text: "Rush into things", keyed: "minus", category: "C6", type: "likert_5" },
    { id: "91", text: "Get stressed out easily", keyed: "plus", category: "N1", type: "likert_5" },
    { id: "92", text: "Keep others at a distance", keyed: "minus", category: "E1", type: "likert_5" },
    { id: "93", text: "Like to get lost in thought", keyed: "plus", category: "O1", type: "likert_5" },
    { id: "94", text: "Distrust people", keyed: "minus", category: "A1", type: "likert_5" },
    { id: "95", text: "Know how to get things done", keyed: "plus", category: "C1", type: "likert_5" },
    { id: "96", text: "Am not easily annoyed", keyed: "minus", category: "N2", type: "likert_5" },
    { id: "97", text: "Avoid crowds", keyed: "minus", category: "E2", type: "likert_5" },
    { id: "98", text: "Do not enjoy going to art museums", keyed: "minus", category: "O2", type: "likert_5" },
    { id: "99", text: "Obstruct others' plans", keyed: "minus", category: "A2", type: "likert_5" },
    { id: "100", text: "Leave my belongings around", keyed: "minus", category: "C2", type: "likert_5" },
    { id: "101", text: "Feel comfortable with myself", keyed: "minus", category: "N3", type: "likert_5" },
    { id: "102", text: "Wait for others to lead the way", keyed: "minus", category: "E3", type: "likert_5" },
    { id: "103", text: "Don't understand people who get emotional", keyed: "minus", category: "O3", type: "likert_5" },
    { id: "104", text: "Take no time for others", keyed: "minus", category: "A3", type: "likert_5" },
    { id: "105", text: "Break my promises", keyed: "minus", category: "C3", type: "likert_5" },
    { id: "106", text: "Am not bothered by difficult social situations", keyed: "minus", category: "N4", type: "likert_5" },
    { id: "107", text: "Like to take it easy", keyed: "minus", category: "E4", type: "likert_5" },
    { id: "108", text: "Am attached to conventional ways", keyed: "minus", category: "O4", type: "likert_5" },
    { id: "109", text: "Get back at others", keyed: "minus", category: "A4", type: "likert_5" },
    { id: "110", text: "Put little time and effort into my work", keyed: "minus", category: "C4", type: "likert_5" },
    { id: "111", text: "Am able to control my cravings", keyed: "minus", category: "N5", type: "likert_5" },
    { id: "112", text: "Act wild and crazy", keyed: "plus", category: "E5", type: "likert_5" },
    { id: "113", text: "Am not interested in theoretical discussions", keyed: "minus", category: "O5", type: "likert_5" },
    { id: "114", text: "Boast about my virtues", keyed: "minus", category: "A5", type: "likert_5" },
    { id: "115", text: "Have difficulty starting tasks", keyed: "minus", category: "C5", type: "likert_5" },
    { id: "116", text: "Remain calm under pressure", keyed: "minus", category: "N6", type: "likert_5" },
    { id: "117", text: "Look at the bright side of life", keyed: "plus", category: "E6", type: "likert_5" },
    { id: "118", text: "Believe that we should be tough on crime", keyed: "minus", category: "O6", type: "likert_5" },
    { id: "119", text: "Try not to think about the needy", keyed: "minus", category: "A6", type: "likert_5" },
    { id: "120", text: "Act without thinking", keyed: "minus", category: "C6", type: "likert_5" },
];

export function calculateBigFiveScores(rawScores: Record<string, number[]>): InventoryResult {
    const traitScores: Record<string, number> = {};
    const facetScores: Record<string, number> = {};
    const domainScores: Record<string, number> = {};

    // Initialize domains
    ['N', 'E', 'O', 'A', 'C'].forEach(d => domainScores[d] = 0);

    BIG_FIVE_ITEMS.forEach(item => {
        const scores = rawScores[item.id];
        if (!scores || scores.length === 0) return;

        // Calculate mean
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Reverse code if needed
        let finalScore = mean;
        if (item.keyed === 'minus') {
            finalScore = 6 - mean;
        }

        // Add to facet
        const facet = item.category!; // e.g. "N1"
        facetScores[facet] = (facetScores[facet] || 0) + finalScore;
    });

    // Calculate Domain Scores (Sum of facets)
    // Each facet has 4 items.
    // Domain has 6 facets.

    // Actually, let's just sum the items directly to domains for simplicity, 
    // but keeping facets is good for the radar chart.

    Object.keys(facetScores).forEach(facet => {
        const domain = facet.charAt(0);
        domainScores[domain] = (domainScores[domain] || 0) + facetScores[facet];
    });

    return {
        inventoryName: "Big Five (IPIP-NEO-120)",
        rawScores,
        traitScores: { ...facetScores, ...domainScores },
    };
}
