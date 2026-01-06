import { NextRequest, NextResponse } from 'next/server';
import { calculateBigFiveScores } from '@/lib/psychometrics/inventories/bigfive';
import { calculateMBTIScores } from '@/lib/psychometrics/inventories/mbti';
import { calculateDISCScores } from '@/lib/psychometrics/inventories/disc';

/**
 * POST /api/psychometrics
 * Calculate multiple psychometric profiles from item responses
 * 
 * Request body:
 * {
 *   rawScores: Record<string, number[]>,  // itemId -> array of scores
 *   inventories: string[]                 // ['bigfive', 'mbti', 'disc']
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     bigfive?: { ... },
 *     mbti?: { ... },
 *     disc?: { ... }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawScores, inventories = ['bigfive', 'mbti', 'disc'] } = body;

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

    if (!Array.isArray(inventories) || inventories.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid inventories parameter',
          message: 'inventories must be a non-empty array of: "bigfive", "mbti", "disc"' 
        },
        { status: 400 }
      );
    }

    // Validate inventory names
    const validInventories = ['bigfive', 'mbti', 'disc'];
    for (const inventory of inventories) {
      if (!validInventories.includes(inventory)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid inventory name',
            message: `"${inventory}" is not valid. Valid options: ${validInventories.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate scores
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
    }

    // Calculate scores for requested inventories
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    if (inventories.includes('bigfive')) {
      try {
        results.bigfive = calculateBigFiveScores(rawScores);
      } catch (error) {
        errors.bigfive = error instanceof Error ? error.message : 'Calculation failed';
      }
    }

    if (inventories.includes('mbti')) {
      try {
        results.mbti = calculateMBTIScores(rawScores);
      } catch (error) {
        errors.mbti = error instanceof Error ? error.message : 'Calculation failed';
      }
    }

    if (inventories.includes('disc')) {
      try {
        results.disc = calculateDISCScores(rawScores);
      } catch (error) {
        errors.disc = error instanceof Error ? error.message : 'Calculation failed';
      }
    }

    // If all calculations failed, return error
    if (Object.keys(results).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'All calculations failed',
          details: errors
        },
        { status: 500 }
      );
    }

    // Return results with any partial errors
    return NextResponse.json({
      success: true,
      data: results,
      ...(Object.keys(errors).length > 0 && { 
        warnings: errors,
        message: 'Some calculations failed'
      }),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Psychometrics calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate psychometric scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/psychometrics
 * Returns API documentation and example usage
 */
export async function GET() {
  return NextResponse.json({
    name: 'Combined Psychometrics API',
    description: 'Calculate multiple personality assessments in a single request',
    method: 'POST',
    endpoint: '/api/psychometrics',
    requestFormat: {
      rawScores: {
        type: 'object',
        description: 'Map of itemId to array of scores',
        required: true,
        example: {
          'N1': [4, 5, 4, 4, 5],
          'mbti_ie_1': [3, 3, 4, 3, 3],
          'disc_1': [1, 2, 1, 1, 2]
        }
      },
      inventories: {
        type: 'array',
        description: 'List of inventories to calculate',
        required: false,
        default: ['bigfive', 'mbti', 'disc'],
        options: ['bigfive', 'mbti', 'disc'],
        example: ['bigfive', 'mbti']
      }
    },
    responseFormat: {
      success: 'boolean',
      data: {
        bigfive: 'Big Five personality scores (if requested)',
        mbti: 'MBTI type and preferences (if requested)',
        disc: 'DISC behavioral profile (if requested)'
      },
      warnings: 'Any partial failures (optional)',
      timestamp: 'ISO 8601 timestamp'
    },
    individualEndpoints: {
      bigfive: '/api/bigfive - Big Five (OCEAN) personality traits',
      mbti: '/api/mbti - Myers-Briggs Type Indicator',
      disc: '/api/disc - DISC behavioral assessment'
    },
    advantages: {
      efficiency: 'Calculate multiple profiles in one request',
      consistency: 'All calculations use the same raw data',
      flexibility: 'Choose which inventories to calculate',
      partialSuccess: 'Returns successful calculations even if some fail'
    },
    exampleRequest: {
      method: 'POST',
      url: '/api/psychometrics',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        rawScores: {
          'N1': [4, 5, 4, 4, 5],
          'E1': [3, 3, 4, 3, 3]
        },
        inventories: ['bigfive', 'mbti']
      }
    }
  });
}
