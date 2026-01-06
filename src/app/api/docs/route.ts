import { NextRequest, NextResponse } from 'next/server';

const API_DOCUMENTATION = {
  name: 'AI Psychometrics Lab - Complete API Documentation',
  version: '1.0.0',
  description: 'REST API for administering psychometric assessments to Large Language Models using the SICWA (Stateless Independent Context Window Approach) methodology',
  baseUrl: '/api',
  
  overview: {
    purpose: 'Profile LLMs with standard psychometric inventories (Big Five, MBTI, DISC)',
    methodology: 'SICWA - Treats each test item as independent, stateless requests to eliminate conversational bias',
    sampling: 'Each item is sampled 5 independent times, with responses averaged',
    database: 'All results automatically saved to Supabase PostgreSQL'
  },

  authentication: {
    type: 'API Key from Environment',
    location: 'NEXT_PUBLIC_OPENROUTER_API_KEY',
    note: 'Set in .env.local, automatically used by server-side endpoints'
  },

  endpoints: {
    analysis: {
      title: '🎯 Analysis Endpoints',
      operations: [
        {
          path: '/api/analyze',
          method: 'POST',
          description: 'Run complete psychometric analysis on an LLM',
          isCore: true,
          requestBody: {
            model: {
              type: 'string',
              required: true,
              description: 'Model identifier (e.g., "anthropic/claude-3.5-sonnet")',
              examples: [
                'anthropic/claude-3.5-sonnet',
                'openai/gpt-4-turbo',
                'meta-llama/llama-3.1-70b-instruct'
              ]
            },
            inventories: {
              type: 'array<string>',
              required: false,
              default: ['bigfive'],
              options: ['bigfive', 'mbti', 'disc'],
              description: 'Psychometric inventories to administer'
            },
            persona: {
              type: 'string',
              required: false,
              default: 'Base Model',
              description: 'Persona or condition name for tracking'
            },
            systemPrompt: {
              type: 'string',
              required: false,
              default: '',
              description: 'Optional system prompt to configure model behavior'
            }
          },
          response: {
            success: 'boolean',
            message: 'string - "Analysis invoked"',
            details: {
              model: 'string',
              persona: 'string',
              inventories: 'array',
              estimatedTime: 'string'
            }
          },
          workflow: [
            '1. Validates input parameters',
            '2. Returns immediate success response',
            '3. Runs asynchronous analysis in background',
            '4. Queries model with inventory items (5 samples each)',
            '5. Parses and aggregates responses',
            '6. Calculates psychometric scores',
            '7. Saves results to Supabase database'
          ],
          example: {
            request: {
              model: 'anthropic/claude-3.5-sonnet',
              inventories: ['bigfive', 'mbti'],
              persona: 'Base Model'
            },
            response: {
              success: true,
              message: 'Analysis invoked',
              details: {
                model: 'anthropic/claude-3.5-sonnet',
                persona: 'Base Model',
                inventories: ['bigfive', 'mbti'],
                estimatedTime: '4-6 minutes'
              }
            }
          }
        }
      ]
    },

    scoring: {
      title: '📊 Direct Scoring Endpoints',
      description: 'Calculate psychometric scores from raw item responses without running LLM queries',
      operations: [
        {
          path: '/api/bigfive',
          method: 'POST',
          description: 'Calculate Big Five (OCEAN) personality scores',
          scoring: 'Big Five IPIP-NEO-120 with facet and domain scoring',
          domains: ['Neuroticism', 'Extraversion', 'Openness', 'Agreeableness', 'Conscientiousness'],
          requestBody: {
            rawScores: {
              type: 'object<string, number[]>',
              description: 'Item ID to array of scores (1-5 scale)',
              example: { 'N1': [4, 5, 4, 4, 5], 'E1': [3, 3, 4, 3, 3] }
            }
          },
          response: {
            domains: 'Record<string, number> - 24-120 range',
            facets: 'Record<string, number> - 4-20 range',
            interpretations: 'Record<string, string> - Low/Medium/High'
          }
        },
        {
          path: '/api/mbti',
          method: 'POST',
          description: 'Calculate MBTI personality type',
          scoring: 'Myers-Briggs Type Indicator with preference strength index',
          dimensions: ['IE (Introversion/Extraversion)', 'SN (Sensing/Intuition)', 'TF (Thinking/Feeling)', 'JP (Judging/Perceiving)'],
          types: 16,
          requestBody: {
            rawScores: {
              type: 'object<string, number[]>',
              description: 'Item ID to array of scores (1-5 scale)',
              example: { 'mbti_1': [4, 5, 4, 4, 5], 'mbti_2': [3, 3, 4, 3, 3] }
            }
          },
          response: {
            type: 'string - 4-letter MBTI type (e.g., INTJ)',
            dimensions: 'Record - Raw dimension scores (8-40 range)',
            psi: 'Record - Preference Strength Index (0-1)'
          }
        },
        {
          path: '/api/disc',
          method: 'POST',
          description: 'Calculate DISC behavioral profile',
          scoring: 'DISC assessment with quadrant analysis',
          quadrants: ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'],
          requestBody: {
            rawScores: {
              type: 'object<string, number[]>',
              description: 'Item ID to array of scores',
              example: { 'disc_1': [1, 2, 1, 1, 2] }
            }
          },
          response: {
            scores: 'Record<string, number> - Raw DISC scores',
            percentages: 'Record<string, number> - 0-100 percentages',
            profile: 'string - Primary behavioral style'
          }
        },
        {
          path: '/api/psychometrics',
          method: 'POST',
          description: 'Calculate multiple psychometric profiles at once',
          advantages: [
            'Single request for multiple inventories',
            'Consistent data across all calculations',
            'Partial success support'
          ],
          requestBody: {
            rawScores: {
              type: 'object<string, number[]>',
              required: true,
              description: 'Item ID to array of scores'
            },
            inventories: {
              type: 'array<string>',
              required: false,
              default: ['bigfive', 'mbti', 'disc'],
              options: ['bigfive', 'mbti', 'disc']
            }
          },
          response: {
            bigfive: 'Optional - Big Five results',
            mbti: 'Optional - MBTI results',
            disc: 'Optional - DISC results'
          }
        }
      ]
    },

    database: {
      title: '💾 Database/Results Endpoints',
      operations: [
        {
          path: '/api/runs',
          method: 'GET',
          description: 'Fetch all psychometric analysis results',
          queryParams: {
            model: 'string - Filter by model name (partial match)',
            persona: 'string - Filter by persona',
            limit: 'number - Results per page (default: 50)',
            offset: 'number - Pagination offset (default: 0)'
          },
          example: '/api/runs?model=claude&limit=10&offset=0',
          response: {
            data: 'array - List of runs',
            pagination: {
              limit: 'number',
              offset: 'number',
              total: 'number'
            }
          }
        },
        {
          path: '/api/runs',
          method: 'POST',
          description: 'Manually save a psychometric profile',
          requestBody: {
            modelName: 'string - Required',
            persona: 'string - Optional',
            systemPrompt: 'string - Optional',
            results: 'object - Scoring results',
            timestamp: 'string - ISO 8601 timestamp (optional)'
          }
        },
        {
          path: '/api/runs/[id]',
          method: 'GET',
          description: 'Fetch a specific analysis run by UUID',
          urlParam: 'id - UUID of the run',
          example: '/api/runs/550e8400-e29b-41d4-a716-446655440000'
        },
        {
          path: '/api/runs/[id]',
          method: 'DELETE',
          description: 'Delete a specific run by UUID',
          urlParam: 'id - UUID of the run'
        }
      ]
    }
  },

  inventories: {
    bigfive: {
      name: 'Big Five Personality (OCEAN)',
      items: 120,
      facets: 24,
      domains: 5,
      scoring: {
        itemScore: '1-5 scale, averaged from 5 samples',
        reverseCoding: 'Negatively-keyed items: score = 6 - itemScore',
        facetScore: 'Sum of 4 items, range 4-20',
        domainScore: 'Sum of 6 facets, range 24-120',
        interpretation: {
          low: 'score < 56',
          medium: '56 ≤ score ≤ 88',
          high: 'score > 88'
        }
      },
      timeEstimate: '10-15 minutes'
    },
    mbti: {
      name: 'Myers-Briggs Type Indicator',
      items: 32,
      dimensions: 4,
      types: 16,
      scoring: {
        samplesPerItem: 5,
        dimensionScore: 'Sum of 8 items, range 8-40',
        threshold: 24,
        psi: 'Preference Strength Index (0-1)',
        typeDerivation: 'Higher score determines letter (E vs I, etc.)'
      },
      timeEstimate: '5-8 minutes'
    },
    disc: {
      name: 'DISC Behavioral Assessment',
      items: 24,
      quadrants: 4,
      method: 'Most/Least forced-choice',
      scoring: {
        format: 'Select most and least descriptive words',
        aggregation: 'Count selections to determine quadrant strengths',
        profile: 'Primary style is highest scoring quadrant',
        percentages: 'Normalized 0-100 per quadrant'
      },
      timeEstimate: '3-5 minutes'
    }
  },

  dataModel: {
    run: {
      id: 'UUID - Primary key',
      model_name: 'string - LLM identifier',
      persona: 'string - Condition/persona name',
      config: 'JSONB - Configuration including systemPrompt',
      results: 'JSONB - Scoring results for all inventories',
      logs: 'JSONB - Execution logs',
      created_at: 'timestamp - ISO 8601'
    }
  },

  exampleWorkflows: [
    {
      title: 'Quick Analysis of Single Model',
      steps: [
        'POST /api/analyze { model: "claude-3.5-sonnet", inventories: ["bigfive"] }',
        'Receive: { success: true, message: "Analysis invoked" }',
        'Wait for background processing (~10-15 min)',
        'GET /api/runs?model=claude to fetch results'
      ]
    },
    {
      title: 'Compare Multiple Personas',
      steps: [
        'POST /api/analyze { model: "gpt-4", persona: "Helpful" }',
        'POST /api/analyze { model: "gpt-4", persona: "Creative" }',
        'POST /api/analyze { model: "gpt-4", persona: "Cautious" }',
        'GET /api/runs?model=gpt-4 to see all results',
        'Compare personality profiles across personas'
      ]
    },
    {
      title: 'Direct Score Calculation from Raw Data',
      steps: [
        'Have raw response data from inventory administration',
        'POST /api/bigfive { rawScores: {...} }',
        'POST /api/mbti { rawScores: {...} }',
        'POST /api/disc { rawScores: {...} }',
        'Or use /api/psychometrics for all at once'
      ]
    }
  ],

  errorHandling: {
    400: 'Bad Request - Invalid parameters',
    401: 'Unauthorized - Missing API key',
    404: 'Not Found - Resource does not exist',
    500: 'Internal Server Error - Server-side issue',
    503: 'Service Unavailable - Database or API key not configured',
    responses: {
      error: 'string - Error message',
      message: 'string - Detailed error description'
    }
  },

  rateLimit: {
    consideration: 'OpenRouter API rate limits apply',
    recommendation: 'Space out multiple /api/analyze requests by 5-10 seconds',
    note: 'Each analysis makes 120-600 requests depending on inventories'
  },

  bestPractices: [
    'Always check GET endpoint documentation via OPTIONS or GET request',
    'Use /api/analyze for automated testing workflows',
    'Use individual scoring endpoints for custom data processing',
    'Store run IDs for tracking and comparison',
    'Use persona parameter to track different configurations',
    'Monitor estimated time for long-running analyses'
  ]
};

/**
 * GET /api/docs
 * Returns comprehensive API documentation
 */
export async function GET(request: NextRequest) {
  const format = new URL(request.url).searchParams.get('format');
  
  if (format === 'markdown') {
    return new NextResponse(generateMarkdown(API_DOCUMENTATION), {
      headers: { 'Content-Type': 'text/markdown' }
    });
  }

  return NextResponse.json(API_DOCUMENTATION, {
    headers: {
      'Content-Type': 'application/json',
      'X-Format': 'JSON - Add ?format=markdown for markdown version'
    }
  });
}

function generateMarkdown(docs: any): string {
  return `# ${docs.name}

**Version:** ${docs.version}

**Description:** ${docs.description}

## Overview

${docs.overview.purpose}

- **Methodology:** ${docs.overview.methodology}
- **Sampling:** ${docs.overview.sampling}
- **Database:** ${docs.overview.database}

## Authentication

- **Type:** ${docs.authentication.type}
- **Location:** \`${docs.authentication.location}\`
- **Note:** ${docs.authentication.note}

## 🎯 Analysis Endpoints

### POST ${docs.endpoints.analysis.operations[0].path}

${docs.endpoints.analysis.operations[0].description}

**Request Body:**
\`\`\`json
{
  "model": "anthropic/claude-3.5-sonnet",
  "inventories": ["bigfive", "mbti"],
  "persona": "Base Model",
  "systemPrompt": ""
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Analysis invoked",
  "details": {
    "model": "anthropic/claude-3.5-sonnet",
    "persona": "Base Model",
    "inventories": ["bigfive", "mbti"],
    "estimatedTime": "4-6 minutes"
  }
}
\`\`\`

## 📊 Scoring Endpoints

### POST /api/bigfive
Calculate Big Five (OCEAN) personality scores

### POST /api/mbti
Calculate MBTI personality type

### POST /api/disc
Calculate DISC behavioral profile

### POST /api/psychometrics
Calculate multiple profiles at once

## 💾 Database Endpoints

### GET /api/runs
Fetch all analysis results with optional filtering

### GET /api/runs?model=claude&limit=10
Filter by model and paginate

### GET /api/runs/[id]
Fetch specific run by UUID

### DELETE /api/runs/[id]
Delete a specific run

## Inventories

### Big Five (IPIP-NEO-120)
- **Items:** 120
- **Facets:** 24
- **Domains:** 5 (N, E, O, A, C)
- **Score Range:** 24-120 per domain
- **Time:** 10-15 minutes

### MBTI
- **Items:** 32
- **Dimensions:** 4 (IE, SN, TF, JP)
- **Types:** 16 possible combinations
- **Time:** 5-8 minutes

### DISC
- **Items:** 24
- **Quadrants:** 4 (D, I, S, C)
- **Method:** Most/Least forced-choice
- **Time:** 3-5 minutes

## Example Usage

\`\`\`bash
# Run complete analysis
curl -X POST http://localhost:3000/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "inventories": ["bigfive", "mbti"],
    "persona": "Base Model"
  }'

# Fetch results
curl http://localhost:3000/api/runs

# Calculate scores directly
curl -X POST http://localhost:3000/api/bigfive \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawScores": {
      "N1": [4, 5, 4, 4, 5],
      "E1": [3, 3, 4, 3, 3]
    }
  }'
\`\`\`

## Error Handling

- **400:** Bad Request - Invalid parameters
- **401:** Unauthorized - Missing API key
- **404:** Not Found - Resource not found
- **500:** Internal Server Error
- **503:** Service Unavailable - Database not configured

---

*Last Updated: ${new Date().toISOString()}*
`;
}
