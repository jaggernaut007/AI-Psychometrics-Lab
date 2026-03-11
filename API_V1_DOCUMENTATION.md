# AI Psychometrics Lab - Public API v1

**Version:** 1.0.0
**Authors:** Gordon Olson, Shreyas Jagannath
**Base URL:** `/api/v1`

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Response Format](#response-format)
5. [Endpoints](#endpoints)
6. [Error Handling](#error-handling)
7. [Quick Start](#quick-start)
8. [Examples](#examples)

---

## Overview

The v1 API provides authenticated, rate-limited access to psychometric assessments for LLMs. It supports all four inventories (Big Five, MBTI, DISC, Dark Triad) via the shared `@apl/psychometrics-core` engine.

### Key Differences from Legacy API

| Feature | Legacy (`/api/analyze`) | v1 (`/api/v1/*`) |
|---------|------------------------|-------------------|
| Authentication | None | Bearer token |
| Rate Limiting | None | 60 req/min sliding window |
| Dark Triad | Not supported | Supported |
| Response Format | `{ success, data }` | Envelope `{ data, meta, pagination }` |
| Compare Profiles | Not available | `POST /compare` |
| OpenAPI Docs | Not available | `GET /docs` |

---

## Authentication

All endpoints except `/api/v1/inventories` and `/api/v1/docs` require an API key.

### Setup

Set the `APL_API_KEY` environment variable on the server:

```bash
# .env.local
APL_API_KEY=apl_live_your_secret_key_here
```

### Usage

Pass the key as a Bearer token:

```bash
curl -H "Authorization: Bearer apl_live_your_secret_key_here" \
  https://your-host/api/v1/assessments
```

The key is validated using constant-time comparison to prevent timing attacks.

---

## Rate Limiting

- **Default limit:** 60 requests per minute per IP
- **Window:** Sliding window (resets after 60 seconds of inactivity)
- **Max tracked clients:** 10,000 (excess IPs are rejected to prevent memory exhaustion)

Rate limit headers are returned on every response:

```
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1710200000000
```

When rate limited, the API returns HTTP 429:

```json
{
  "error": {
    "type": "rate_limit_error",
    "title": "Too Many Requests",
    "status": 429,
    "detail": "Rate limit exceeded. Try again after 2026-03-11T12:01:00.000Z."
  }
}
```

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "version": "v1",
    "timestamp": "2026-03-11T12:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "meta": { ... },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 42
  }
}
```

### Error Response

```json
{
  "error": {
    "type": "validation_error",
    "title": "Invalid Request",
    "status": 400,
    "detail": "Descriptive error message."
  },
  "meta": { ... }
}
```

---

## Endpoints

### GET /api/v1/inventories

**Public** — no authentication required.

Returns metadata for all available psychometric inventories.

```bash
curl https://your-host/api/v1/inventories
```

**Response:**

```json
{
  "data": {
    "bigfive": {
      "itemCount": 120,
      "dimensions": ["N", "E", "O", "A", "C"],
      "description": "IPIP-NEO-120 — measures the five major personality dimensions with 30 facets"
    },
    "mbti": {
      "itemCount": 32,
      "dimensions": ["IE", "SN", "TF", "JP"],
      "description": "OEJTS 1.2 — four-dimension type indicator yielding one of 16 types"
    },
    "disc": {
      "itemCount": 28,
      "dimensions": ["D", "I", "S", "C"],
      "description": "DISC assessment — behavioral profile using forced-choice word groups"
    },
    "darktriad": {
      "itemCount": 27,
      "dimensions": ["Machiavellianism", "Narcissism", "Psychopathy"],
      "description": "Short Dark Triad (SD3) — measures subclinical dark personality traits"
    }
  }
}
```

---

### POST /api/v1/assessments

**Authenticated.** Starts a new psychometric assessment asynchronously.

```bash
curl -X POST https://your-host/api/v1/assessments \
  -H "Authorization: Bearer $APL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "inventories": ["bigfive", "darktriad"],
    "persona": "Base Model",
    "systemPrompt": "",
    "openrouterApiKey": "sk-or-v1-..."
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | OpenRouter model identifier |
| `inventories` | string[] | Yes | `bigfive`, `mbti`, `disc`, `darktriad` |
| `persona` | string | No | Label for this condition (default: "Base Model") |
| `systemPrompt` | string | No | System prompt to inject |
| `openrouterApiKey` | string | No | Falls back to server's `NEXT_PUBLIC_OPENROUTER_API_KEY` |

**Response (202 Accepted):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "estimatedTime": "290s"
  }
}
```

---

### GET /api/v1/assessments

**Authenticated.** List assessment runs with pagination and filtering.

```bash
curl -H "Authorization: Bearer $APL_API_KEY" \
  "https://your-host/api/v1/assessments?model=claude&limit=10&offset=0"
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | — | Filter by model name (partial match, case-insensitive) |
| `persona` | string | — | Filter by persona (exact match) |
| `limit` | integer | 20 | Results per page (max 100) |
| `offset` | integer | 0 | Pagination offset |

---

### GET /api/v1/assessments/:id

**Authenticated.** Get a specific assessment by UUID.

```bash
curl -H "Authorization: Bearer $APL_API_KEY" \
  https://your-host/api/v1/assessments/550e8400-e29b-41d4-a716-446655440000
```

---

### POST /api/v1/compare

**Authenticated.** Compare psychometric profiles across models or runs.

```bash
curl -X POST https://your-host/api/v1/compare \
  -H "Authorization: Bearer $APL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "runIds": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002"
    ]
  }'
```

| Field | Type | Description |
|-------|------|-------------|
| `runIds` | string[] | UUIDs of specific runs to compare |
| `models` | string[] | Model names — uses most recent run per model |

At least one of `runIds` or `models` must be provided. At least 2 runs are needed for comparison.

**Response:**

```json
{
  "data": {
    "runCount": 2,
    "runs": [
      { "id": "...", "model": "gpt-4o", "persona": "Base Model", "createdAt": "2026-01-01T..." },
      { "id": "...", "model": "claude-3", "persona": "Base Model", "createdAt": "2026-01-02T..." }
    ],
    "comparisons": [
      {
        "inventory": "bigfive",
        "traits": [
          { "trait": "N", "values": { "gpt-4o (550e84...)": 50, "claude-3 (660f95...)": 40 }, "delta": 10, "min": 40, "max": 50 },
          { "trait": "E", "values": { "gpt-4o (550e84...)": 60, "claude-3 (660f95...)": 70 }, "delta": 10, "min": 60, "max": 70 }
        ]
      }
    ]
  }
}
```

---

### GET /api/v1/docs

**Public** — no authentication required.

Returns the OpenAPI 3.0.3 specification for the API.

```bash
curl https://your-host/api/v1/docs
```

---

## Error Handling

| Status | Type | Meaning |
|--------|------|---------|
| 400 | `validation_error` | Invalid request parameters |
| 401 | `authentication_error` | Missing Authorization header |
| 403 | `authentication_error` | Invalid API key |
| 404 | `not_found` | Resource does not exist |
| 429 | `rate_limit_error` | Too many requests |
| 500 | `server_error` | Server-side failure |
| 503 | `service_unavailable` | Supabase/OpenRouter not configured |

---

## Quick Start

```bash
# 1. Set your API key
export APL_API_KEY=apl_live_your_key

# 2. Check available inventories (no auth needed)
curl http://localhost:3000/api/v1/inventories

# 3. Start an assessment
curl -X POST http://localhost:3000/api/v1/assessments \
  -H "Authorization: Bearer $APL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4o", "inventories": ["bigfive", "darktriad"]}'

# 4. Poll for results
curl -H "Authorization: Bearer $APL_API_KEY" \
  http://localhost:3000/api/v1/assessments/<run-id>

# 5. Compare two models
curl -X POST http://localhost:3000/api/v1/compare \
  -H "Authorization: Bearer $APL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"models": ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"]}'
```

---

## Examples

### Python Client

```python
import requests

API_URL = "http://localhost:3000/api/v1"
API_KEY = "apl_live_your_key"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Start assessment
resp = requests.post(f"{API_URL}/assessments", json={
    "model": "openai/gpt-4o",
    "inventories": ["bigfive", "mbti", "darktriad"],
}, headers=HEADERS)
run_id = resp.json()["data"]["id"]
print(f"Assessment started: {run_id}")

# Poll for results
import time
while True:
    result = requests.get(f"{API_URL}/assessments/{run_id}", headers=HEADERS).json()
    if result["data"].get("results"):
        print("Done!", result["data"]["results"])
        break
    time.sleep(30)
```

### JavaScript/TypeScript Client

```typescript
const API_URL = 'http://localhost:3000/api/v1';
const headers = {
  'Authorization': `Bearer ${process.env.APL_API_KEY}`,
  'Content-Type': 'application/json',
};

// Start assessment
const { data } = await fetch(`${API_URL}/assessments`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    inventories: ['bigfive', 'darktriad'],
  }),
}).then(r => r.json());

console.log('Run ID:', data.id);

// Get results later
const result = await fetch(`${API_URL}/assessments/${data.id}`, { headers })
  .then(r => r.json());
```

---

**Last Updated:** March 11, 2026
**Version:** 1.0.0
