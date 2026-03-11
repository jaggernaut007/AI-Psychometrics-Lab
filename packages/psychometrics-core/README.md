# @apl/psychometrics-core

Core psychometric assessment engine for the AI Psychometrics Lab. Provides inventory definitions, scoring algorithms, and a pluggable LLM backend system for profiling AI models using standardized psychometric tests.

## Installation

This is a workspace package. From the monorepo root:

```bash
npm install
```

## Usage

### Running an Assessment

```typescript
import {
  runAssessment,
  createOpenRouterBackend,
  OllamaBackend,
} from '@apl/psychometrics-core';

// With OpenRouter (cloud models)
const backend = createOpenRouterBackend({
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3.5-sonnet',
});

const profile = await runAssessment(backend, {
  model: 'anthropic/claude-3.5-sonnet',
  inventories: ['bigfive', 'mbti', 'disc', 'darktriad'],
  persona: 'Base Model',
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
  onLog: (msg, type) => console.log(`[${type}] ${msg}`),
});

// With Ollama (local models)
const ollamaBackend = new OllamaBackend({
  model: 'llama3.2',
  baseUrl: 'http://localhost:11434',
});

const localProfile = await runAssessment(ollamaBackend, {
  model: 'llama3.2',
  inventories: ['darktriad'],
  samplesPerItem: 3, // fewer samples for faster local inference
});
```

### Available Inventories

| ID | Name | Items | Dimensions |
|----|------|-------|------------|
| `bigfive` | Big Five (IPIP-NEO-120) | 120 | N, E, O, A, C (+ 30 facets) |
| `mbti` | MBTI (OEJTS 1.2) | 32 | IE, SN, TF, JP → 16 types |
| `disc` | DISC Assessment | 28 | D, I, S, C |
| `darktriad` | Dark Triad (SD3) | 27 | Machiavellianism, Narcissism, Psychopathy |

### Custom Backend

Implement the `LLMBackend` interface to use any model provider:

```typescript
import type { LLMBackend } from '@apl/psychometrics-core';

const myBackend: LLMBackend = {
  async query(prompt, systemPrompt, temperature) {
    // Call your model API here
    return '3'; // Return the raw text response
  },
};
```

## Architecture

```
src/
├── types.ts          # Core interfaces (LLMBackend, ModelProfile, etc.)
├── engine.ts         # Assessment runner (prompt construction, parsing, scoring)
├── calibration.ts    # Score calibration for LLM neutrality bias
├── definitions.ts    # Trait descriptions and inventory metadata
├── inventories/      # Inventory items and scoring algorithms
│   ├── bigfive.ts    # IPIP-NEO-120
│   ├── mbti.ts       # OEJTS 1.2
│   ├── disc.ts       # DISC word groups
│   └── darktriad.ts  # SD3
└── backends/
    ├── openrouter.ts # OpenRouter API with retry/backoff
    └── ollama.ts     # Local Ollama inference
```

## Methodology: SICWA

The engine uses the **Stateless Independent Context Window Approach**: each inventory item is sent as an independent API call with no conversation history, and each item is sampled multiple times (default: 5) to reduce variance. This eliminates conversational bias and produces more reliable psychometric profiles.

## Authors

Gordon Olson, Shreyas Jagannath
