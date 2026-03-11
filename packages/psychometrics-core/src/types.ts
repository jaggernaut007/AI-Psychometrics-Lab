/**
 * Core type definitions for the psychometric assessment system.
 * @author Gordon Olson, Shreyas Jagannath
 */

export interface InventoryItem {
  id: string;
  text: string;
  type: 'likert_5' | 'choice_binary' | 'choice_text';
  category?: string;
  keyed?: 'plus' | 'minus';
  options?: string[];
  // MBTI specific
  leftText?: string;
  rightText?: string;
  dimension?: 'IE' | 'SN' | 'TF' | 'JP';
}

export interface InventoryResult {
  inventoryName: string;
  rawScores: Record<string, number[]>;
  traitScores: Record<string, number>;
  type?: string;
  psi?: Record<string, number>;
  details?: any;
}

export interface ModelProfile {
  modelName: string;
  persona?: string;
  systemPrompt?: string;
  timestamp: number;
  results: Record<string, InventoryResult>;
  logs?: LogEntry[];
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

/**
 * LLMBackend is the abstraction that allows plugging in different
 * model providers (OpenRouter, Ollama, etc.)
 */
export interface LLMBackend {
  query(prompt: string, systemPrompt: string, temperature: number): Promise<string>;
}

export interface AssessmentOptions {
  model: string;
  inventories: string[];
  persona?: string;
  systemPrompt?: string;
  chunkSize?: number;
  samplesPerItem?: number;
  onProgress?: (completed: number, total: number) => void;
  onLog?: (message: string, type: 'info' | 'error' | 'success') => void;
}

export interface DISCItem extends InventoryItem {
  words: {
    text: string;
    quadrant: 'D' | 'I' | 'S' | 'C';
  }[];
}
