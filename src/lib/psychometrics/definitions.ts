export const BIG_FIVE_DEFINITIONS: Record<string, { title: string; description: string; high: string; medium: string; low: string }> = {
    N: {
        title: "Neuroticism",
        description: "The tendency to experience negative emotions such as anxiety, anger, and depression. It measures emotional stability.",
        high: "Prone to stress, anxiety, and emotional instability. Likely to interpret ordinary situations as threatening.",
        medium: "Generally calm but can feel stressed or anxious in demanding situations. A balanced emotional profile.",
        low: "Emotionally stable, calm, and resilient. Less likely to get upset or stressed.",
    },
    E: {
        title: "Extraversion",
        description: "Characterized by excitability, sociability, talkativeness, assertiveness, and high amounts of emotional expressiveness.",
        high: "Sociable, energetic, and action-oriented. Enjoys being the center of attention.",
        medium: "Enjoy social situations but also value time alone. Comfortable in both busy and quiet environments.",
        low: "Reserved, independent, and prefers solitude. Less exuberant and more deliberate.",
    },
    O: {
        title: "Openness",
        description: "Features characteristics such as imagination and insight. It measures the breadth, depth, and complexity of an individual's mental life and experiences.",
        high: "Creative, curious, and open to new ideas. Appreciates art and abstract concepts.",
        medium: "Appreciate new experiences but also value tradition and routine. A balance of curiosity and practicality.",
        low: "Practical, conventional, and prefers routine. Skeptical of the unknown.",
    },
    A: {
        title: "Agreeableness",
        description: "Includes attributes such as trust, altruism, kindness, affection, and other prosocial behaviors.",
        high: "Cooperative, compassionate, and trusting. Values harmony and helping others.",
        medium: "Generally warm and trusting, but can be firm or skeptical when necessary.",
        low: "Competitive, critical, and skeptical of others' motives. Can be seen as uncooperative.",
    },
    C: {
        title: "Conscientiousness",
        description: "Defined by high levels of thoughtfulness, good impulse control, and goal-directed behaviors.",
        high: "Organized, disciplined, and reliable. Plans ahead and aims for achievement.",
        medium: "Reasonably organized and reliable, but can be flexible or spontaneous at times.",
        low: "Spontaneous, disorganized, and flexible. May dislike structure and schedules.",
    },

};

export const DISC_DEFINITIONS: Record<string, { title: string; description: string; high: string; low: string }> = {
    D: {
        title: "Dominance",
        description: "Focuses on achieving results, overcoming opposition, and taking action.",
        high: "Direct, firm, result-oriented, and competitive. Loves challenges.",
        low: "Hesitant, mild, cooperative, and non-demanding. Dislikes conflict."
    },
    I: {
        title: "Influence",
        description: "Focuses on influencing or persuading others, openness, and relationships.",
        high: "Outgoing, enthusiastic, optimistic, and persuasive. Loves being with people.",
        low: "Reserved, reflective, matter-of-fact, and skeptical. Prefers data over people."
    },
    S: {
        title: "Steadiness",
        description: "Focuses on cooperation, sincerity, and dependability.",
        high: "Patient, consistent, loyal, and good listener. loves stability and calm.",
        low: "Impulsive, flexible, energetic, and fast-paced. Dislikes routine."
    },
    C: {
        title: "Compliance",
        description: "Focuses on quality, accuracy, expertise, and competency.",
        high: "Analytical, precise, cautious, and systematic. Loves rules and data.",
        low: "Independent, unconcerned with details, rule-breaking, and fearless. Dislikes restrictions."
    }
};

export const MBTI_DEFINITIONS: Record<string, string> = {
    "INTJ": "Strategic thinkers with a plan for everything. Analytical, imaginative, and determined.",
    "INTP": "Innovative inventors with an unquenchable thirst for knowledge. Logical and curious.",
    "ENTJ": "Bold, imaginative, and strong-willed leaders, always finding a way - or making one.",
    "ENTP": "Smart and curious thinkers who cannot resist an intellectual challenge.",
    "INFJ": "Quiet and mystical, yet very inspiring and tireless idealists.",
    "INFP": "Poetic, kind and altruistic people, always eager to help a good cause.",
    "ENFJ": "Charismatic and inspiring leaders, able to mesmerize their listeners.",
    "ENFP": "Enthusiastic, creative and sociable free spirits, who can always find a reason to smile.",
    "ISTJ": "Practical and fact-minded individuals, whose reliability cannot be doubted.",
    "ISFJ": "Very dedicated and warm protectors, always ready to defend their loved ones.",
    "ESTJ": "Excellent administrators, unsurpassed at managing things - or people.",
    "ESFJ": "Extraordinarily caring, social and popular people, always eager to help.",
    "ISTP": "Bold and practical experimenters, masters of all kinds of tools.",
    "ISFP": "Flexible and charming artists, always ready to explore and experience something new.",
    "ESTP": "Smart, energetic and very perceptive people, who truly enjoy living on the edge.",
    "ESFP": "Spontaneous, energetic and enthusiastic people - life is never boring around them."
};
