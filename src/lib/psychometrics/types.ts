export interface InventoryItem {
  id: string;
  text: string;
  type: 'likert_5' | 'choice_binary' | 'choice_text';
  category?: string; // e.g., "Neuroticism", "E1"
  keyed?: 'plus' | 'minus'; // For reverse coding
  options?: string[]; // For choice questions
}

export interface InventoryResult {
  inventoryName: string;
  rawScores: Record<string, number[]>; // itemId -> array of scores (from N samples)
  traitScores: Record<string, number>; // traitId -> score
  type?: string; // For MBTI (e.g. "INTJ")
  psi?: Record<string, number>; // For MBTI (Preference Strength Index)
  details?: any;
}

export interface ModelProfile {
  modelName: string;
  persona?: string; // e.g. "Base Model" or "Skeptic"
  systemPrompt?: string; // The full system prompt used
  timestamp: number;
  results: Record<string, InventoryResult>;
}
