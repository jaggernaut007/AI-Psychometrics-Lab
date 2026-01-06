import { NextRequest, NextResponse } from 'next/server';
import { calculateDISCScores } from '@/lib/psychometrics/inventories/disc';

/**
 * POST /api/disc
 * Calculate DISC personality profile from item responses
 * 
 * Request body:
 * {
 *   rawScores: Record<string, number[]>  // itemId -> array of scores
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     scores: { D: number, I: number, S: number, C: number },
 *     percentages: { D: number, I: number, S: number, C: number },
 *     profile: string,                // Primary style (e.g., "Dominance")
 *     interpretations: Record<string, string>
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawScores } = body;

    // Validate input
    if (!rawScores || typeof rawScores !== 'object') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request format',
          message: 'rawScores object is required. Format: { "itemId": [score1, score2, ...] }' 
        },
        { status: 400 }
      );
    }

    // Validate each item's scores
    for (const [itemId, scores] of Object.entries(rawScores)) {
      if (!Array.isArray(scores)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid score format',
            message: `Item "${itemId}" must have an array of scores` 
          },
          { status: 400 }
        );
      }

      // DISC items are binary choices or Most/Least selections
      for (const score of scores) {
        if (typeof score !== 'number') {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid score value',
              message: `All scores must be numbers. Found invalid score in "${itemId}"` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Calculate DISC scores
    const results = calculateDISCScores(rawScores);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('DISC calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate DISC scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disc
 * Returns API documentation and example usage
 */
export async function GET() {
  return NextResponse.json({
    name: 'DISC Personality Scoring API',
    description: 'Calculate DISC behavioral profile from assessment responses',
    method: 'POST',
    endpoint: '/api/disc',
    requestFormat: {
      rawScores: {
        type: 'object',
        description: 'Map of itemId to array of scores (typically 5 samples per item)',
        example: {
          'disc_1': [1, 2, 1, 1, 2],
          'disc_2': [3, 4, 3, 3, 4],
          'disc_3': [2, 2, 3, 2, 2]
        }
      }
    },
    responseFormat: {
      success: 'boolean',
      data: {
        scores: 'Raw scores for D, I, S, C dimensions',
        percentages: 'Normalized percentages (0-100) for each dimension',
        profile: 'Primary behavioral style (highest scoring dimension)',
        interpretations: 'Text descriptions for each dimension'
      },
      timestamp: 'ISO 8601 timestamp'
    },
    dimensions: {
      D: {
        name: 'Dominance',
        description: 'Focuses on achieving results, overcoming opposition, taking action',
        high: 'Direct, firm, result-oriented, competitive',
        low: 'Hesitant, mild, cooperative, non-demanding'
      },
      I: {
        name: 'Influence',
        description: 'Focuses on influencing others, openness, relationships',
        high: 'Outgoing, enthusiastic, optimistic, persuasive',
        low: 'Reserved, factual, skeptical, analytical'
      },
      S: {
        name: 'Steadiness',
        description: 'Focuses on cooperation, sincerity, dependability',
        high: 'Patient, calm, stable, consistent',
        low: 'Active, restless, dynamic, impatient'
      },
      C: {
        name: 'Conscientiousness',
        description: 'Focuses on quality, accuracy, expertise, competency',
        high: 'Analytical, precise, systematic, diplomatic',
        low: 'Unstructured, independent, firm, strong-willed'
      }
    },
    assessmentFormat: {
      method: 'Most/Least forced-choice',
      description: 'Respondents select words that describe them MOST and LEAST from groups of 4 words',
      scoring: 'Aggregates choices across items to determine relative strength of each dimension'
    },
    interpretation: {
      profile: 'Primary style is the highest scoring dimension',
      blends: 'Many people show blends (e.g., high D and I)',
      percentages: 'Show relative emphasis of each behavioral tendency'
    }
  });
}
