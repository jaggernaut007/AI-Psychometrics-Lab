import { InventoryItem, InventoryResult } from '../types';
import { calibrateMBTIDimension } from '../calibration';

export const MBTI_ITEMS: InventoryItem[] = [
    // IE Scale (High > 24 = Extraversion)
    // Target: 1=Introversion, 5=Extraversion
    { id: "mbti_1", text: "Social Interaction", type: "likert_5", dimension: 'IE', leftText: "Needs time alone", rightText: "Bored by time alone" },
    { id: "mbti_2", text: "Energy Source", type: "likert_5", dimension: 'IE', leftText: "Mellow", rightText: "Energetic" },
    { id: "mbti_3", text: "Group Work", type: "likert_5", dimension: 'IE', leftText: "Works best alone", rightText: "Works best in groups" },
    { id: "mbti_4", text: "Parties", type: "likert_5", dimension: 'IE', leftText: "Gets worn out by parties", rightText: "Gets fired up by parties" },
    { id: "mbti_5", text: "Conversation", type: "likert_5", dimension: 'IE', leftText: "Listens more", rightText: "Talks more" },
    { id: "mbti_6", text: "Going Out", type: "likert_5", dimension: 'IE', leftText: "Stays at home", rightText: "Goes out on the town" },
    { id: "mbti_7", text: "Communication Volume", type: "likert_5", dimension: 'IE', leftText: "Finds it difficult to yell very loudly", rightText: "Yelling to others when they are far away comes naturally" }, // Corrected for 1=I, 5=E
    { id: "mbti_8", text: "Public Speaking", type: "likert_5", dimension: 'IE', leftText: "Avoids public speaking", rightText: "Likes to perform in front of other people" },

    // SN Scale (High > 24 = Intuition)
    // Target: 1=Sensing, 5=Intuition
    { id: "mbti_9", text: "Perspective", type: "likert_5", dimension: 'SN', leftText: "Accepts things as they are", rightText: "Unsatisfied with the way things are" },
    { id: "mbti_10", text: "Question Style", type: "likert_5", dimension: 'SN', leftText: "Prefer to take multiple choice test", rightText: "Prefer essay answers" },
    { id: "mbti_11", text: "Time Focus", type: "likert_5", dimension: 'SN', leftText: "Focused on the present", rightText: "Focused on the future" },
    { id: "mbti_12", text: "Social Fit", type: "likert_5", dimension: 'SN', leftText: "Fits in", rightText: "Stands out" },
    { id: "mbti_13", text: "Storytelling", type: "likert_5", dimension: 'SN', leftText: "Tell people what happened", rightText: "Tell people what it meant" },
    { id: "mbti_14", text: "Viewpoint", type: "likert_5", dimension: 'SN', leftText: "Wants the details", rightText: "Wants the big picture" },
    { id: "mbti_15", text: "Verification", type: "likert_5", dimension: 'SN', leftText: "Empirical", rightText: "Theoretical" },
    { id: "mbti_16", text: "Curiosity", type: "likert_5", dimension: 'SN', leftText: "Likes to know \"who?\", \"what?\", \"when?\"", rightText: "Likes to know \"why?\"" },

    // TF Scale (High > 24 = Thinking)
    // Target: 1=Feeling, 5=Thinking
    { id: "mbti_17", text: "Belief", type: "likert_5", dimension: 'TF', leftText: "Wants to believe", rightText: "Sceptical" },
    { id: "mbti_18", text: "Mindset", type: "likert_5", dimension: 'TF', leftText: "Thinks \"robotic\" is an insult", rightText: "Strives to have a mechanical mind" },
    { id: "mbti_19", text: "Sensitivity", type: "likert_5", dimension: 'TF', leftText: "Easily hurt", rightText: "Thick-skinned" },
    { id: "mbti_20", text: "Desire", type: "likert_5", dimension: 'TF', leftText: "Wants their love", rightText: "Wants people's respect" },
    { id: "mbti_21", text: "Skill", type: "likert_5", dimension: 'TF', leftText: "Wants to be good at fixing people", rightText: "Wants to be good at fixing things" },
    { id: "mbti_22", text: "Decision Making", type: "likert_5", dimension: 'TF', leftText: "Follows the heart", rightText: "Follows the head" },
    { id: "mbti_23", text: "Morality", type: "likert_5", dimension: 'TF', leftText: "Bases morality on compassion", rightText: "Bases morality on justice" },
    { id: "mbti_24", text: "Emotion", type: "likert_5", dimension: 'TF', leftText: "Values emotions", rightText: "Uncomfortable with emotions" },

    // JP Scale (High > 24 = Perceiving)
    // Target: 1=Judging, 5=Perceiving
    { id: "mbti_25", text: "Organization", type: "likert_5", dimension: 'JP', leftText: "Makes lists", rightText: "Relies on memory" },
    { id: "mbti_26", text: "Tidiness", type: "likert_5", dimension: 'JP', leftText: "Keeps a clean room", rightText: "Just puts stuff wherever" },
    { id: "mbti_27", text: "Order", type: "likert_5", dimension: 'JP', leftText: "Organized", rightText: "Chaotic" },
    { id: "mbti_28", text: "Planning", type: "likert_5", dimension: 'JP', leftText: "Plans far ahead", rightText: "Plans at the last minute" },
    { id: "mbti_29", text: "Commitment", type: "likert_5", dimension: 'JP', leftText: "Commits", rightText: "Keeps options open" },
    { id: "mbti_30", text: "Execution", type: "likert_5", dimension: 'JP', leftText: "Gets work done right away", rightText: "Procrastinates" },
    { id: "mbti_31", text: "Preparation", type: "likert_5", dimension: 'JP', leftText: "Prepares", rightText: "Improvises" },
    { id: "mbti_32", text: "Work Style", type: "likert_5", dimension: 'JP', leftText: "Works hard", rightText: "Plays hard" }, // Assuming Work=J, Play=P
];

export function calculateMBTIScores(rawScores: Record<string, number[]>, enableCalibration: boolean = true): InventoryResult {
    const traitScores: Record<string, number> = { IE: 0, SN: 0, TF: 0, JP: 0 };

    // Sum scores for each dimension
    MBTI_ITEMS.forEach(item => {
        const scores = rawScores[item.id];
        if (!scores || scores.length === 0) return;

        // Average score for this item across samples
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (item.dimension) {
            traitScores[item.dimension] += mean;
        }
    });

    // Apply calibration if enabled (expands variance to counter LLM neutrality bias)
    const calibrated = enableCalibration
        ? {
            IE: calibrateMBTIDimension(traitScores.IE),
            SN: calibrateMBTIDimension(traitScores.SN),
            TF: calibrateMBTIDimension(traitScores.TF),
            JP: calibrateMBTIDimension(traitScores.JP),
        }
        : traitScores;

    // Determine type using calibrated scores
    const type =
        (calibrated.IE > 24 ? 'E' : 'I') +
        (calibrated.SN > 24 ? 'N' : 'S') +
        (calibrated.TF > 24 ? 'T' : 'F') +
        (calibrated.JP > 24 ? 'P' : 'J');

    // Calculate PSI (Preference Strength Index) from CALIBRATED scores
    // Range for 8 items is 8-40. Midpoint 24. Max delta 16.
    const psi = {
        IE: Math.abs(calibrated.IE - 24) / 16,
        SN: Math.abs(calibrated.SN - 24) / 16,
        TF: Math.abs(calibrated.TF - 24) / 16,
        JP: Math.abs(calibrated.JP - 24) / 16,
    };

    // Add single letter scores for UI compatibility
    // Range 8-40. Complement is 48 - score.
    const augmentedTraitScores = {
        ...calibrated,
        E: calibrated.IE, I: 48 - calibrated.IE,
        N: calibrated.SN, S: 48 - calibrated.SN,
        T: calibrated.TF, F: 48 - calibrated.TF,
        P: calibrated.JP, J: 48 - calibrated.JP,
        // Also store raw for comparison
        _raw_IE: traitScores.IE,
        _raw_SN: traitScores.SN,
        _raw_TF: traitScores.TF,
        _raw_JP: traitScores.JP,
    };

    return {
        inventoryName: "MBTI (OEJTS 1.2)",
        rawScores,
        traitScores: augmentedTraitScores,
        type,
        psi,
        details: { derived: false, source: "OEJTS 1.2", calibrated: enableCalibration }
    };
}

// Keeping derivation for backward compatibility or comparison
export function deriveMBTIFromBigFive(bigFiveResults: InventoryResult): InventoryResult {
    const scores = bigFiveResults.traitScores;
    const MIDPOINT = 72;
    const eScore = scores['E'] || MIDPOINT;
    const oScore = scores['O'] || MIDPOINT;
    const aScore = scores['A'] || MIDPOINT;
    const cScore = scores['C'] || MIDPOINT;
    const MAX_DELTA = 48;
    const psi = {
        IE: Math.abs(eScore - MIDPOINT) / MAX_DELTA,
        SN: Math.abs(oScore - MIDPOINT) / MAX_DELTA,
        TF: Math.abs(aScore - MIDPOINT) / MAX_DELTA,
        JP: Math.abs(cScore - MIDPOINT) / MAX_DELTA,
    };
    const type =
        (eScore >= MIDPOINT ? 'E' : 'I') +
        (oScore >= MIDPOINT ? 'N' : 'S') +
        (aScore >= MIDPOINT ? 'F' : 'T') +
        (cScore >= MIDPOINT ? 'J' : 'P');

    // Synthetic trait scores to match the format
    const traitScores = {
        E: eScore, I: 144 - eScore,
        N: oScore, S: 144 - oScore,
        F: aScore, T: 144 - aScore,
        J: cScore, P: 144 - cScore,
    };

    return {
        inventoryName: "MBTI (Derived from Big Five)",
        rawScores: {},
        traitScores,
        type,
        psi,
        details: { derived: true, source: "IPIP-NEO-120" }
    };
}
