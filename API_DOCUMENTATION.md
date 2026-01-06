# AI Psychometrics Lab - API Documentation

**Version:** 1.0.0  
**Last Updated:** January 6, 2026

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Scoring Endpoints](#scoring-endpoints)
5. [Database Endpoints](#database-endpoints)
6. [Inventories](#inventories)
7. [Data Models](#data-models)
8. [Example Workflows](#example-workflows)
9. [Error Handling](#error-handling)

---

## Overview

**AI Psychometrics Lab** is a REST API for administering psychometric assessments to Large Language Models using the **SICWA** (Stateless Independent Context Window Approach) methodology.

### Key Features

- 🧠 **Multiple Inventories**: Big Five (OCEAN), MBTI, DISC
- 🔄 **Stateless Testing**: Each item treated independently (5 samples per item)
- 💾 **Auto-Save**: Results automatically saved to Supabase
- ⚡ **Real-time Analysis**: Async processing with immediate response
- 📊 **Comprehensive Scoring**: Domain, facet, and preference strength calculations

### Methodology

- **SICWA Approach**: Eliminates conversational bias by treating each test item as independent
- **Sampling**: Each item is queried 5 times independently
- **Aggregation**: Final item score is the average of 5 responses
- **Scoring**: Domain and facet calculations follow psychometric standards

---

## Authentication

### API Key Configuration

All endpoints that query OpenRouter use the API key from your environment:

```bash
# In .env.local
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**Note:** Server-side endpoints automatically use this key. You do not need to provide it in request bodies for `/api/analyze`.

---

## Core Endpoints

### 🎯 POST /api/analyze

**Run complete psychometric analysis on an LLM**

This is the primary endpoint. It automatically:
1. Queries the model with inventory items (5 samples each)
2. Parses and aggregates responses
3. Calculates psychometric scores
4. Saves results to Supabase
5. Returns immediately with "Analysis invoked"

#### Request

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "inventories": ["bigfive", "mbti"],
    "persona": "Base Model",
    "systemPrompt": "You are a helpful assistant."
  }'
```

#### Request Body

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | ✅ Yes | — | Model identifier (see examples below) |
| `inventories` | array | ❌ No | `["bigfive"]` | Inventories to administer: `bigfive`, `mbti`, `disc` |
| `persona` | string | ❌ No | `"Base Model"` | Persona/condition name for tracking |
| `systemPrompt` | string | ❌ No | `""` | Optional system prompt to configure model behavior |

#### Response

```json
{
  "success": true,
  "message": "Analysis invoked",
  "details": {
    "model": "anthropic/claude-3.5-sonnet",
    "persona": "Base Model",
    "inventories": ["bigfive", "mbti"],
    "estimatedTime": "4-6 minutes",
    "note": "Results will be saved to database upon completion"
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

#### Model Examples

```
anthropic/claude-3.5-sonnet
anthropic/claude-3-opus
openai/gpt-4-turbo
openai/gpt-4o
meta-llama/llama-3.1-70b-instruct
deepseek/deepseek-chat
mistralai/mistral-large-2
```

#### Workflow

1. Request received and validated
2. Immediate response: `"Analysis invoked"`
3. Background process starts:
   - Creates list of all inventory items
   - Queries model for each item (5 independent samples)
   - Parses responses into scores (1-5 scale)
   - Calculates domain/facet/preference scores
   - Saves to Supabase with logs
4. Results available via `/api/runs`

#### Time Estimates

- **Big Five only**: 10-15 minutes
- **MBTI only**: 5-8 minutes
- **DISC only**: 3-5 minutes
- **All three**: 20-30 minutes

---

## Scoring Endpoints

### Direct Score Calculation

Calculate psychometric scores from raw item responses without running LLM queries. Use these when you already have response data.

### POST /api/bigfive

**Calculate Big Five (OCEAN) personality scores**

#### Request

```bash
curl -X POST http://localhost:3000/api/bigfive \
  -H "Content-Type: application/json" \
  -d '{
    "rawScores": {
      "N1": [4, 5, 4, 4, 5],
      "N2": [3, 3, 4, 3, 3],
      "E1": [2, 2, 3, 2, 2],
      "E2": [1, 2, 1, 1, 2]
    }
  }'
```

#### Request Body

```json
{
  "rawScores": {
    "itemId": [score1, score2, score3, score4, score5],
    "itemId": [5, 4, 5, 4, 5]
  }
}
```

- **itemId**: String identifier for the item (e.g., "N1", "E2")
- **scores**: Array of exactly 5 numbers, each 1-5

#### Response

```json
{
  "success": true,
  "data": {
    "domains": {
      "N": 75,
      "E": 52,
      "O": 88,
      "A": 68,
      "C": 80
    },
    "facets": {
      "N1": 14,
      "N2": 12,
      "E1": 8,
      "E2": 6,
      "O1": 18
    },
    "interpretations": {
      "N": "High",
      "E": "Medium",
      "O": "High",
      "A": "Medium",
      "C": "High"
    }
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

#### Domains

| Domain | Full Name | Range | Low | Medium | High |
|--------|-----------|-------|-----|--------|------|
| **N** | Neuroticism | 24-120 | <56 | 56-88 | >88 |
| **E** | Extraversion | 24-120 | <56 | 56-88 | >88 |
| **O** | Openness | 24-120 | <56 | 56-88 | >88 |
| **A** | Agreeableness | 24-120 | <56 | 56-88 | >88 |
| **C** | Conscientiousness | 24-120 | <56 | 56-88 | >88 |

---

### POST /api/mbti

**Calculate MBTI personality type and scores**

#### Request

```bash
curl -X POST http://localhost:3000/api/mbti \
  -H "Content-Type: application/json" \
  -d '{
    "rawScores": {
      "mbti_1": [3, 2, 3, 3, 2],
      "mbti_2": [2, 2, 3, 2, 2],
      "mbti_9": [4, 5, 4, 4, 5],
      "mbti_10": [5, 4, 5, 5, 4]
    }
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "type": "INTJ",
    "dimensions": {
      "IE": 18.5,
      "SN": 36.2,
      "TF": 31.8,
      "JP": 22.4
    },
    "psi": {
      "IE": 0.34,
      "SN": 0.76,
      "TF": 0.49,
      "JP": 0.10
    }
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

#### Dimensions

| Dimension | Scale | Meaning |
|-----------|-------|---------|
| **IE** | 8-40 | Introversion (low) to Extraversion (high) |
| **SN** | 8-40 | Sensing (low) to Intuition (high) |
| **TF** | 8-40 | Feeling (low) to Thinking (high) |
| **JP** | 8-40 | Judging (low) to Perceiving (high) |

#### PSI (Preference Strength Index)

- **Range**: 0-1
- **0 = Neutral**: No preference (score near 24)
- **1 = Strong**: Very strong preference (score far from 24)
- **Interpretation**: Higher = more confident type preference

#### 16 Types

```
NF (Idealists)      NT (Rationals)       SJ (Guardians)       SP (Artisans)
├─ ENFP             ├─ ENTJ              ├─ ESTJ              ├─ ESTP
├─ ENFJ             ├─ ENTP              ├─ ESFJ              ├─ ESFP
├─ INFP             ├─ INTJ              ├─ ISTJ              ├─ ISTP
└─ INFJ             └─ INTP              └─ ISFJ              └─ ISFP
```

---

### POST /api/disc

**Calculate DISC behavioral profile**

#### Request

```bash
curl -X POST http://localhost:3000/api/disc \
  -H "Content-Type: application/json" \
  -d '{
    "rawScores": {
      "disc_1": [1, 2, 1, 1, 2],
      "disc_2": [3, 4, 3, 3, 4],
      "disc_3": [2, 2, 3, 2, 2]
    }
  }'
```

#### Response

```json
{
  "success": true,
  "data": {
    "scores": {
      "D": 28,
      "I": 45,
      "S": 22,
      "C": 35
    },
    "percentages": {
      "D": 25,
      "I": 42,
      "S": 20,
      "C": 33
    },
    "profile": "Influence"
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

#### Quadrants

| Quadrant | Description | High Traits | Low Traits |
|----------|-------------|-------------|-----------|
| **D** | Dominance | Direct, firm, result-oriented | Hesitant, cooperative |
| **I** | Influence | Outgoing, enthusiastic, persuasive | Reserved, analytical |
| **S** | Steadiness | Patient, calm, stable, reliable | Active, impatient |
| **C** | Conscientiousness | Analytical, systematic, careful | Unstructured, spontaneous |

---

### POST /api/psychometrics

**Calculate multiple psychometric profiles at once**

#### Request

```bash
curl -X POST http://localhost:3000/api/psychometrics \
  -H "Content-Type: application/json" \
  -d '{
    "rawScores": {
      "N1": [4, 5, 4, 4, 5],
      "mbti_1": [3, 2, 3, 3, 2],
      "disc_1": [1, 2, 1, 1, 2]
    },
    "inventories": ["bigfive", "mbti", "disc"]
  }'
```

#### Request Body

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rawScores` | object | ✅ Yes | — | Item ID to scores array |
| `inventories` | array | ❌ No | All | `["bigfive", "mbti", "disc"]` |

#### Response

```json
{
  "success": true,
  "data": {
    "bigfive": { /* Big Five results */ },
    "mbti": { /* MBTI results */ },
    "disc": { /* DISC results */ }
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

#### Benefits

- ✅ Single request for multiple inventories
- ✅ Consistent data across all calculations
- ✅ Partial success: Returns successful calculations even if some fail
- ✅ Reduced latency vs. multiple requests

---

## Database Endpoints

### GET /api/runs

**Fetch all psychometric analysis results**

#### Request

```bash
# Get all runs
curl http://localhost:3000/api/runs

# Filter by model
curl http://localhost:3000/api/runs?model=claude

# Filter by persona
curl http://localhost:3000/api/runs?persona=Helpful

# Pagination
curl http://localhost:3000/api/runs?limit=10&offset=20

# Combined
curl http://localhost:3000/api/runs?model=claude&persona=Helpful&limit=5
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | — | Partial match on model name (case-insensitive) |
| `persona` | string | — | Exact match on persona |
| `limit` | number | 50 | Number of results per page |
| `offset` | number | 0 | Pagination offset |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "model_name": "anthropic/claude-3.5-sonnet",
      "persona": "Base Model",
      "config": {
        "systemPrompt": ""
      },
      "results": {
        "bigfive": { /* Big Five results */ },
        "mbti": { /* MBTI results */ }
      },
      "logs": [ /* Execution logs */ ],
      "created_at": "2026-01-06T12:34:56.789Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 127
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

---

### POST /api/runs

**Manually save a psychometric profile**

#### Request

```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "anthropic/claude-3.5-sonnet",
    "persona": "Base Model",
    "systemPrompt": "",
    "results": {
      "bigfive": { /* Big Five results */ },
      "mbti": { /* MBTI results */ }
    }
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modelName` | string | ✅ Yes | LLM identifier |
| `persona` | string | ❌ No | Persona/condition name |
| `systemPrompt` | string | ❌ No | System prompt used |
| `results` | object | ✅ Yes | Scoring results from `/api/bigfive`, `/api/mbti`, etc. |
| `timestamp` | string | ❌ No | ISO 8601 timestamp (defaults to now) |

#### Response

```json
{
  "success": true,
  "message": "Run saved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "model_name": "anthropic/claude-3.5-sonnet",
    "created_at": "2026-01-06T12:34:56.789Z"
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

---

### GET /api/runs/[id]

**Fetch a specific analysis run by UUID**

#### Request

```bash
curl http://localhost:3000/api/runs/550e8400-e29b-41d4-a716-446655440000
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "model_name": "anthropic/claude-3.5-sonnet",
    "persona": "Base Model",
    "config": { "systemPrompt": "" },
    "results": { /* Full results */ },
    "logs": [ /* Execution logs */ ],
    "created_at": "2026-01-06T12:34:56.789Z"
  },
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

---

### DELETE /api/runs/[id]

**Delete a specific run by UUID**

#### Request

```bash
curl -X DELETE http://localhost:3000/api/runs/550e8400-e29b-41d4-a716-446655440000
```

#### Response

```json
{
  "success": true,
  "message": "Run deleted successfully",
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

---

## Inventories

### Big Five (IPIP-NEO-120)

**The Big Five personality model with 120 items**

- **Items**: 120 total
- **Facets**: 24 (6 per domain)
- **Domains**: 5 (N, E, O, A, C)
- **Score Range**: 24-120 per domain
- **Estimated Time**: 10-15 minutes

#### Domains

```
N (Neuroticism) - Emotional stability vs. negative emotions
├─ Anxiety, Anger, Depression, Self-Consciousness, Immoderation, Vulnerability

E (Extraversion) - Sociability and assertiveness
├─ Friendliness, Gregariousness, Assertiveness, Activity Level, Excitement-Seeking, Cheerfulness

O (Openness) - Creativity and curiosity
├─ Imagination, Artistic Interests, Emotionality, Adventurousness, Intellect, Liberalism

A (Agreeableness) - Compassion and cooperation
├─ Trust, Morality, Altruism, Cooperation, Modesty, Sympathy

C (Conscientiousness) - Organization and discipline
├─ Self-Efficacy, Orderliness, Dutifulness, Achievement-Striving, Self-Discipline, Cautiousness
```

#### Scoring

```
Item Score:     Average of 5 samples (1-5 scale)
Reverse Coding: Some items: Score = 6 - Item Score
Facet Score:    Sum of 4 items (Range: 4-20)
Domain Score:   Sum of 6 facets (Range: 24-120)

Interpretation:
  Low:    < 56
  Medium: 56-88
  High:   > 88
```

---

### MBTI (Myers-Briggs Type Indicator)

**The Myers-Briggs Type Indicator with 32 items**

- **Items**: 32 total (8 per dimension)
- **Dimensions**: 4 (IE, SN, TF, JP)
- **Types**: 16 possible combinations
- **Estimated Time**: 5-8 minutes

#### Dimensions

```
IE (Introversion vs Extraversion)
├─ Items 1-8: Energy orientation
├─ Low (I):  Introspective, reserved, prefers solitude
└─ High (E): Outgoing, sociable, seeks stimulation

SN (Sensing vs Intuition)
├─ Items 9-16: Information processing
├─ Low (S):   Practical, detail-oriented, here-and-now
└─ High (N):  Imaginative, big-picture, future-focused

TF (Thinking vs Feeling)
├─ Items 17-24: Decision-making
├─ Low (F):   People-focused, values harmony
└─ High (T):  Logic-focused, objective analysis

JP (Judging vs Perceiving)
├─ Items 25-32: Lifestyle structure
├─ Low (J):   Organized, planning, decisive
└─ High (P):  Flexible, adaptive, spontaneous
```

#### Scoring

```
Dimension Score:  Sum of 8 items (Range: 8-40)
Threshold:        24 (midpoint)
Type Letter:      If score > 24: right letter; if < 24: left letter

PSI Calculation:  |Score - 24| / 16 (Range: 0-1)
  0 = Neutral preference
  1 = Very strong preference
```

---

### DISC (Behavioral Assessment)

**DISC assessment with 24 items (Most/Least format)**

- **Items**: 24 total
- **Quadrants**: 4 (D, I, S, C)
- **Format**: Most/Least forced-choice
- **Estimated Time**: 3-5 minutes

#### Quadrants

```
D - Dominance (Results-oriented)
├─ Traits: Direct, firm, competitive, results-focused
├─ High: Takes charge, overcomes obstacles
└─ Low: Cooperative, non-demanding, hesitant

I - Influence (People-oriented)
├─ Traits: Outgoing, enthusiastic, persuasive, optimistic
├─ High: Influences others, builds relationships
└─ Low: Reserved, analytical, skeptical

S - Steadiness (Relationship-oriented)
├─ Traits: Patient, calm, stable, loyal, consistent
├─ High: Supportive, reliable, team player
└─ Low: Restless, impatient, seeks variety

C - Conscientiousness (Quality-oriented)
├─ Traits: Analytical, precise, systematic, diplomatic
├─ High: Accuracy-focused, quality-driven
└─ Low: Unstructured, flexible, independent
```

#### Scoring

```
Method:   Most/Least forced-choice from word groups
Count:    Aggregate selections per quadrant
Profile:  Primary style = highest scoring quadrant
Result:   Can be single style or blend of multiple
```

---

## Data Models

### Run Record (Supabase)

```sql
CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  model_name text NOT NULL,
  persona text,
  config jsonb,                    -- {systemPrompt: string}
  results jsonb NOT NULL,          -- {bigfive: {...}, mbti: {...}, ...}
  logs jsonb,                      -- Array of log entries
  model_version text
)
```

### Results Structure

```json
{
  "bigfive": {
    "inventoryName": "Big Five",
    "rawScores": { "itemId": [5, 4, 5, 4, 5], ... },
    "traitScores": { "N": 75, "E": 52, ... },
    "details": { ... }
  },
  "mbti": {
    "inventoryName": "MBTI",
    "type": "INTJ",
    "psi": { "IE": 0.34, "SN": 0.76, ... },
    "details": { ... }
  },
  "disc": {
    "inventoryName": "DISC",
    "traitScores": { "D": 28, "I": 45, ... },
    "details": { ... }
  }
}
```

---

## Example Workflows

### Workflow 1: Quick Analysis of Single Model

```bash
# 1. Start analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "inventories": ["bigfive"]
  }'

# Response: {"success": true, "message": "Analysis invoked"}

# 2. Wait 10-15 minutes for Big Five analysis to complete

# 3. Fetch results
curl http://localhost:3000/api/runs?model=claude

# 4. View specific run
curl http://localhost:3000/api/runs/{id}
```

### Workflow 2: Compare Multiple Personas

```bash
# 1. Test same model with different personas
curl -X POST http://localhost:3000/api/analyze \
  -d '{"model":"gpt-4","persona":"Helpful","inventories":["bigfive"]}'

curl -X POST http://localhost:3000/api/analyze \
  -d '{"model":"gpt-4","persona":"Creative","inventories":["bigfive"]}'

curl -X POST http://localhost:3000/api/analyze \
  -d '{"model":"gpt-4","persona":"Cautious","inventories":["bigfive"]}'

# 2. Fetch all results
curl http://localhost:3000/api/runs?model=gpt-4

# 3. Compare personality profiles across conditions
```

### Workflow 3: Direct Score Calculation

```bash
# 1. Have raw response data from inventory administration
rawScores={
  "N1": [4, 5, 4, 4, 5],
  "N2": [3, 3, 4, 3, 3],
  ...
}

# 2. Calculate Big Five
curl -X POST http://localhost:3000/api/bigfive \
  -d "{\"rawScores\": $rawScores}"

# 3. Calculate MBTI
curl -X POST http://localhost:3000/api/mbti \
  -d "{\"rawScores\": $rawScores}"

# 4. Or calculate all at once
curl -X POST http://localhost:3000/api/psychometrics \
  -d "{\"rawScores\": $rawScores, \"inventories\": [\"bigfive\", \"mbti\", \"disc\"]}"
```

### Workflow 4: Batch Analysis

```bash
# Analyze multiple models
MODELS=("claude-3.5-sonnet" "gpt-4-turbo" "llama-3.1-70b")

for model in "${MODELS[@]}"; do
  curl -X POST http://localhost:3000/api/analyze \
    -d "{\"model\": \"$model\", \"inventories\": [\"bigfive\", \"mbti\"]}"
  
  # Space out requests to avoid rate limits
  sleep 10
done

# After all complete, fetch and compare all results
curl http://localhost:3000/api/runs?limit=100
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Resource (run ID) does not exist |
| 500 | Internal Error | Server-side error during processing |
| 503 | Unavailable | Supabase or OpenRouter not configured |

### Error Response Format

```json
{
  "success": false,
  "error": "Error title",
  "message": "Detailed error description",
  "timestamp": "2026-01-06T12:34:56.789Z"
}
```

### Common Errors

```json
{
  "success": false,
  "error": "Invalid inventory name",
  "message": "\"xyz\" is not valid. Valid options: bigfive, mbti, disc"
}
```

```json
{
  "success": false,
  "error": "OpenRouter API key not configured",
  "message": "NEXT_PUBLIC_OPENROUTER_API_KEY is not set"
}
```

```json
{
  "success": false,
  "error": "Run not found",
  "message": "Resource with ID 550e8400... does not exist"
}
```

---

## Rate Limiting & Performance

### OpenRouter Rate Limits

- Varies by API key tier
- Each analysis makes 120-600 API requests depending on inventories
- **Recommendation**: Space multiple `/api/analyze` requests 5-10 seconds apart

### Request Per Inventory

| Inventory | Items | Samples | Total Requests |
|-----------|-------|---------|-----------------|
| Big Five | 120 | 5 | 600 |
| MBTI | 32 | 5 | 160 |
| DISC | 24 | 5 | 120 |

### Estimated Time per Inventory

- **Big Five**: 10-15 minutes
- **MBTI**: 5-8 minutes
- **DISC**: 3-5 minutes

---

## Best Practices

1. **Use `/api/analyze` for automated workflows**
   - Handles LLM testing, scoring, and storage automatically
   - Returns immediately so you can poll for results later

2. **Use direct scoring endpoints for custom data**
   - If you already have response data, use `/api/bigfive`, `/api/mbti`, etc.
   - Faster processing without LLM queries

3. **Track persona across conditions**
   - Use `persona` parameter to identify different model configurations
   - Makes comparisons easier later

4. **Store run IDs for tracking**
   - Each analysis gets a unique UUID
   - Use it to fetch, update, or delete results

5. **Monitor logs for debugging**
   - Each run includes execution logs
   - Helps diagnose parsing or API errors

6. **Space out batch requests**
   - Don't submit 10 analyses simultaneously
   - Use 5-10 second delays between requests

---

## Documentation Access

### View API Docs Programmatically

```bash
# JSON format
curl http://localhost:3000/api/docs

# Markdown format
curl http://localhost:3000/api/docs?format=markdown
```

### In-Endpoint Documentation

Each endpoint responds to GET requests with usage information:

```bash
curl http://localhost:3000/api/bigfive
curl http://localhost:3000/api/mbti
curl http://localhost:3000/api/disc
curl http://localhost:3000/api/analyze
```

---

**Last Updated:** January 6, 2026  
**Version:** 1.0.0
