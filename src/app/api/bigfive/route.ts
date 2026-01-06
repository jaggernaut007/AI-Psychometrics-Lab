import { NextRequest, NextResponse } from 'next/server';
import { calculateBigFiveScores } from '@/lib/psychometrics/inventories/bigfive';

/**
 * POST /api/bigfive
 * Calculate Big Five personality scores from item responses
 * 
 * Request body:
 * {
 *   rawScores: Record<string, number[]>  // itemId -> array of scores (1-5)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     domains: { N: number, E: number, O: number, A: number, C: number },
 *     facets: Record<string, number>,
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

      for (const score of scores) {
        if (typeof score !== 'number' || score < 1 || score > 5) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid score value',
              message: `All scores must be numbers between 1 and 5. Found invalid score in "${itemId}"` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Calculate Big Five scores
    const results = calculateBigFiveScores(rawScores);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Big Five calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate Big Five scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bigfive
 * Returns API documentation and example usage
 */
export async function GET() {
  return NextResponse.json({
    name: 'Big Five Personality Scoring API',
    description: 'Calculate Big Five (OCEAN) personality scores from IPIP-NEO-120 inventory responses',
    method: 'POST',
    endpoint: '/api/bigfive',
    requestFormat: {
      rawScores: {
        type: 'object',
        description: 'Map of itemId to array of scores (typically 5 samples per item)',
        example: {
          'N1': [4, 5, 4, 4, 5],
          'E1': [3, 3, 4, 3, 3],
          'O1': [5, 4, 5, 5, 4]
        }
      }
    },
    responseFormat: {
      success: 'boolean',
      data: {
        domains: 'Domain scores (N, E, O, A, C) ranging from 24-120',
        facets: 'Facet scores for each sub-trait (24 total) ranging from 4-20',
        interpretations: 'Text interpretations (Low/Medium/High) for each domain'
      },
      timestamp: 'ISO 8601 timestamp'
    },
    domains: {
      N: 'Neuroticism - Emotional stability',
      E: 'Extraversion - Sociability and assertiveness',
      O: 'Openness - Creativity and curiosity',
      A: 'Agreeableness - Compassion and cooperation',
      C: 'Conscientiousness - Organization and discipline'
    },
    scoring: {
      itemScoring: 'Each item sampled 5 times, averaged',
      reverseCoding: 'Negatively-keyed items: score = 6 - rawScore',
      facetScores: 'Sum of 4 items per facet (range: 4-20)',
      domainScores: 'Sum of 6 facets per domain (range: 24-120)',
      interpretation: {
        low: 'score < 56',
        medium: '56 ≤ score ≤ 88',
        high: 'score > 88'
      }
    }
  });
}
