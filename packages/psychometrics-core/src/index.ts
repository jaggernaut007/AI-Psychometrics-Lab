/**
 * @apl/psychometrics-core - Core psychometric assessment engine
 * @author Gordon Olson, Shreyas Jagannath
 */

// Types
export type {
    InventoryItem,
    InventoryResult,
    ModelProfile,
    LogEntry,
    LLMBackend,
    AssessmentOptions,
    DISCItem,
} from './types';

// Calibration
export {
    calibrateScore,
    calibrateMBTIDimension,
    calibrateBigFiveDomain,
    calibrateDISCQuadrant,
    LLM_BASELINE,
} from './calibration';

// Definitions
export {
    BIG_FIVE_DEFINITIONS,
    DISC_DEFINITIONS,
    DARK_TRIAD_DEFINITIONS,
    MBTI_DEFINITIONS,
    INVENTORY_METADATA,
} from './definitions';

// Inventories
export { BIG_FIVE_ITEMS, calculateBigFiveScores } from './inventories/bigfive';
export { MBTI_ITEMS, calculateMBTIScores, deriveMBTIFromBigFive } from './inventories/mbti';
export { DISC_ITEMS, calculateDISCScores } from './inventories/disc';
export { DARK_TRIAD_ITEMS, calculateDarkTriadScores } from './inventories/darktriad';

// Engine
export {
    runAssessment,
    buildPrompt,
    parseResponse,
    collectItems,
    validateInventories,
} from './engine';

// Backends
export { OpenRouterBackend, createOpenRouterBackend } from './backends/openrouter';
export type { OpenRouterConfig } from './backends/openrouter';
export { OllamaBackend } from './backends/ollama';
export type { OllamaConfig } from './backends/ollama';
