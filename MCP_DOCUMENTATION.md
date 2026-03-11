# AI Psychometrics Lab - MCP Server

**Package:** `@apl/mcp-server`
**Authors:** Shreyas Jagannath
**Transport:** stdio (for use with Claude Desktop, Cursor, and other MCP clients)

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Available Tools](#available-tools)
5. [Storage](#storage)
6. [Backends](#backends)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The MCP (Model Context Protocol) server exposes the psychometric assessment engine as tools that AI assistants (Claude, etc.) can invoke directly. It supports both cloud models via OpenRouter and local models via Ollama.

### What Can It Do?

- Run psychometric assessments on any LLM (cloud or local)
- Store and retrieve results locally or in Supabase
- Compare personality profiles across models
- Detect your hardware specs and recommend local models
- List available psychometric inventories with descriptions

---

## Installation

### From the Monorepo

```bash
# Clone and install
git clone https://github.com/your-org/AI-Psychometrics-Lab.git
cd AI-Psychometrics-Lab
npm install

# Build the MCP server
cd packages/mcp-server
npm run build
```

### Verify the Build

```bash
node dist/index.js --help
# Should start the MCP server on stdio
```

---

## Configuration

### Claude Desktop

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ai-psychometrics": {
      "command": "node",
      "args": ["/absolute/path/to/AI-Psychometrics-Lab/packages/mcp-server/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

### Cursor IDE

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "ai-psychometrics": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | For cloud models | OpenRouter API key for cloud model access |
| `SUPABASE_URL` | No | Supabase project URL (optional — falls back to local storage) |
| `SUPABASE_ANON_KEY` | No | Supabase anon key |

---

## Available Tools

### 1. `list_inventories`

List all available psychometric inventories with metadata and trait descriptions.

**Input:** None

**Example Output:**
```json
{
  "bigfive": {
    "itemCount": 120,
    "dimensions": ["N", "E", "O", "A", "C"],
    "description": "IPIP-NEO-120 — measures the five major personality dimensions with 30 facets"
  },
  "darktriad": {
    "itemCount": 27,
    "dimensions": ["Machiavellianism", "Narcissism", "Psychopathy"],
    "description": "Short Dark Triad (SD3) — measures subclinical dark personality traits"
  }
}
```

---

### 2. `run_assessment`

Run a full psychometric assessment on an LLM.

**Input:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | — | Model identifier (e.g., `openai/gpt-4o` or `llama3.2`) |
| `inventories` | string[] | Yes | — | Which inventories: `bigfive`, `mbti`, `disc`, `darktriad` |
| `backend` | string | No | `openrouter` | `openrouter` or `ollama` |
| `persona` | string | No | `Base Model` | Persona label |
| `systemPrompt` | string | No | `""` | System prompt |
| `apiKey` | string | No | env var | OpenRouter API key override |
| `ollamaBaseUrl` | string | No | `http://localhost:11434` | Ollama base URL |

**Example Usage in Claude:**

> "Run a Big Five and Dark Triad assessment on GPT-4o"

The tool will:
1. Validate the inventories
2. Send each item independently to the model (SICWA methodology)
3. Parse responses and calculate scores
4. Save results to storage
5. Return the full profile

---

### 3. `get_results`

Retrieve stored assessment results.

**Input:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `runId` | string | Specific run ID |
| `model` | string | Filter by model name |
| `limit` | number | Max results to return (default: 10) |

---

### 4. `compare_models`

Compare psychometric profiles across multiple models.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `models` | string[] | Yes | Model names to compare (min 2) |
| `inventories` | string[] | No | Limit comparison to specific inventories |

**Example Usage:**

> "Compare the Big Five profiles of GPT-4o and Claude 3.5 Sonnet"

Returns trait-by-trait comparisons with deltas, min/max scores.

---

### 5. `get_system_specs`

Detect the current machine's hardware specifications.

**Input:** None

**Output:**
```json
{
  "os": "macOS",
  "arch": "arm64",
  "cpu_model": "Apple M2 Pro",
  "cpu_cores": 12,
  "ram_gb": 32,
  "gpu": { "name": "Apple M2 Pro", "vram_gb": 0 }
}
```

Note: `gpu` is `null` when no GPU is detected.

---

### 6. `recommend_local_model`

Get model recommendations based on your hardware.

**Input:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `task` | string | Optional task description |
| `min_quality` | string | `low`, `medium`, or `high` |

**Example Output:**
```json
{
  "systemSpecs": {
    "ram_gb": 32,
    "cpu_cores": 12,
    "gpu": { "name": "Apple M2 Pro", "vram_gb": 0 }
  },
  "recommendations": [
    {
      "model": "llama3.1:70b-q4_K_M",
      "displayName": "Llama 3.1 70B (Q4)",
      "parameterCount": "70B",
      "quality": "high",
      "estimatedTokensPerSec": 8,
      "gpuAccelerated": true,
      "notes": "Best quality for high-end hardware",
      "pullCommand": "ollama pull llama3.1:70b-q4_K_M"
    },
    {
      "model": "llama3.1:8b",
      "displayName": "Llama 3.1 8B",
      "parameterCount": "8B",
      "quality": "medium",
      "estimatedTokensPerSec": 30,
      "gpuAccelerated": false,
      "notes": "Good balance of speed and quality",
      "pullCommand": "ollama pull llama3.1:8b"
    }
  ],
  "total": 2
}
```

---

## Storage

### Local Storage (Default)

When Supabase is not configured, results are stored as JSON files:

```
~/.ai-psychometrics/data/
├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.json
├── b2c3d4e5-f6a7-8901-bcde-f12345678901.json
└── ...
```

Each file contains:
```json
{
  "id": "a1b2c3d4-...",
  "profile": {
    "modelName": "openai/gpt-4o",
    "persona": "Base Model",
    "timestamp": 1710200000000,
    "results": { ... },
    "logs": [ ... ]
  },
  "createdAt": "2026-03-11T12:00:00.000Z"
}
```

### Supabase Storage

When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set, results are stored in the `runs` table in your Supabase project (same table the web app uses).

---

## Backends

### OpenRouter (Cloud Models)

Supports any model available on OpenRouter:

```
anthropic/claude-3.5-sonnet
openai/gpt-4o
meta-llama/llama-3.1-70b-instruct
deepseek/deepseek-chat
mistralai/mistral-large-2
google/gemini-2.0-flash
```

Features:
- Automatic retry with exponential backoff
- Timeout handling (90s default)
- Respects `Retry-After` headers

### Ollama (Local Models)

Run assessments on locally hosted models:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start the server (usually auto-starts)
ollama serve
```

Then use the MCP tool:

> "Run a Dark Triad assessment on llama3.2 using Ollama"

The tool will automatically use the Ollama backend when `backend: "ollama"` is specified.

---

## Examples

### Full Workflow in Claude

1. **Check your hardware:**
   > "What are my system specs?"

2. **Get model recommendations:**
   > "What local model should I use for psychometric testing?"

3. **Run an assessment:**
   > "Run Big Five and MBTI assessments on llama3.2 using Ollama"

4. **View results:**
   > "Show me the results from the last assessment"

5. **Compare models:**
   > "Compare the personality profiles of GPT-4o and llama3.2"

### Batch Testing Multiple Models

> "Run Dark Triad assessments on these models: gpt-4o, claude-3.5-sonnet, and gemini-2.0-flash. Then compare all three."

The assistant will run three assessments sequentially and then present a comparison.

---

## Troubleshooting

### "Cannot connect to Ollama"

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve

# Pull the model if not available
ollama pull llama3.2
```

### "OpenRouter API key not configured"

Set the environment variable in your MCP config:

```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-v1-your-key"
  }
}
```

### "Results not persisting"

Check that the data directory is writable:

```bash
ls -la ~/.ai-psychometrics/data/
```

If using Supabase, verify your connection:

```bash
curl -H "apikey: YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/runs?limit=1
```

### Server Logs

Run the MCP server manually to see debug output:

```bash
cd packages/mcp-server
npx tsx src/index.ts 2>debug.log
```

---

**Last Updated:** March 11, 2026
**Package Version:** 1.0.0
