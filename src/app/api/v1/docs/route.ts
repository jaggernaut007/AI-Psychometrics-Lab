/**
 * GET /api/v1/docs - OpenAPI-style documentation for the v1 API
 * This endpoint is public (no auth required).
 *
 * @author Shreyas Jagannath
 */

import { apiSuccess } from '@/lib/api-response';

const API_DOCS = {
  openapi: '3.0.3',
  info: {
    title: 'AI Psychometrics Lab API',
    version: '1.0.0',
    description:
      'Public REST API for running psychometric assessments on LLMs, retrieving results, and comparing model personality profiles.',
    contact: {
      name: 'Shreyas Jagannath',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 base path',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/assessments': {
      post: {
        summary: 'Start a new assessment',
        description:
          'Launches a psychometric assessment against an LLM. The assessment runs asynchronously. Returns a 202 with the run ID so you can poll for results.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['model', 'inventories'],
                properties: {
                  model: {
                    type: 'string',
                    description: 'OpenRouter model identifier (e.g., "openai/gpt-4o")',
                  },
                  inventories: {
                    type: 'array',
                    items: { type: 'string', enum: ['bigfive', 'mbti', 'disc', 'darktriad'] },
                    description: 'Which inventories to administer',
                  },
                  persona: {
                    type: 'string',
                    description: 'Optional persona label',
                  },
                  systemPrompt: {
                    type: 'string',
                    description: 'Optional system prompt to inject personality',
                  },
                  openrouterApiKey: {
                    type: 'string',
                    description: 'Optional OpenRouter API key (falls back to server default)',
                  },
                },
              },
            },
          },
        },
        responses: {
          202: { description: 'Assessment started' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          429: { description: 'Rate limit exceeded' },
        },
      },
      get: {
        summary: 'List assessments',
        description: 'Retrieve a paginated list of assessment runs.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'model', in: 'query', schema: { type: 'string' }, description: 'Filter by model name (partial match)' },
          { name: 'persona', in: 'query', schema: { type: 'string' }, description: 'Filter by persona (exact match)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: { description: 'Paginated list of assessments' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/assessments/{id}': {
      get: {
        summary: 'Get assessment by ID',
        description: 'Retrieve a specific assessment result by its UUID.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Assessment details' },
          404: { description: 'Assessment not found' },
        },
      },
    },
    '/inventories': {
      get: {
        summary: 'List available inventories',
        description: 'Returns metadata for all available psychometric inventories. No authentication required.',
        security: [],
        responses: {
          200: { description: 'Inventory metadata' },
        },
      },
    },
    '/compare': {
      post: {
        summary: 'Compare profiles',
        description: 'Fetch and compare psychometric profiles trait-by-trait. Supply run IDs and/or model names.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  runIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Specific run IDs to compare',
                  },
                  models: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Model names — the most recent run for each model will be used',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Comparison results' },
          400: { description: 'Validation error or insufficient data' },
        },
      },
    },
    '/docs': {
      get: {
        summary: 'API documentation',
        description: 'Returns this OpenAPI-style documentation. No authentication required.',
        security: [],
        responses: {
          200: { description: 'OpenAPI documentation JSON' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key passed as Bearer token via the Authorization header',
      },
    },
    schemas: {
      ResponseEnvelope: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              version: { type: 'string', example: 'v1' },
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string', format: 'uuid' },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              limit: { type: 'integer' },
              offset: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              status: { type: 'integer' },
              detail: { type: 'string' },
            },
          },
          meta: { $ref: '#/components/schemas/ResponseEnvelope/properties/meta' },
        },
      },
    },
  },
};

export async function GET() {
  return apiSuccess(API_DOCS);
}
