import { NextRequest, NextResponse } from 'next/server';
import { calculateMBTIScores } from '@/lib/psychometrics/inventories/mbti';

/**
 * POST /api/mbti
 * Calculate MBTI personality type and scores from item responses
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
 *     type: string,                    // e.g., "INTJ"
 *     dimensions: Record<string, number>,  // IE, SN, TF, JP scores
 *     psi: Record<string, number>,     // Preference Strength Index (0-100)
 *     preferences: Record<string, string>  // Text descriptions
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

    // Calculate MBTI scores
    const results = calculateMBTIScores(rawScores);

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MBTI calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate MBTI scores',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mbti
 * Returns API documentation and example usage
 */
export async function GET() {
  return NextResponse.json({
    name: 'MBTI Personality Scoring API',
    description: 'Calculate Myers-Briggs Type Indicator (MBTI) personality type from questionnaire responses',
    method: 'POST',
    endpoint: '/api/mbti',
    requestFormat: {
      rawScores: {
        type: 'object',
        description: 'Map of itemId to array of scores (typically 5 samples per item)',
        example: {
          'mbti_ie_1': [4, 5, 4, 4, 5],
          'mbti_ie_2': [3, 3, 4, 3, 3],
          'mbti_sn_1': [5, 4, 5, 5, 4]
        }
      }
    },
    responseFormat: {
      success: 'boolean',
      data: {
        type: '4-letter MBTI type (e.g., INTJ, ENFP)',
        dimensions: 'Scores for each dimension (IE, SN, TF, JP)',
        psi: 'Preference Strength Index (0-100) - confidence in each preference',
        preferences: 'Text descriptions of each preference'
      },
      timestamp: 'ISO 8601 timestamp'
    },
    dimensions: {
      IE: 'Introversion (I) vs Extraversion (E) - Energy orientation',
      SN: 'Sensing (S) vs Intuition (N) - Information processing',
      TF: 'Thinking (T) vs Feeling (F) - Decision making',
      JP: 'Judging (J) vs Perceiving (P) - Lifestyle structure'
    },
    types: {
      analysts: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
      diplomats: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
      sentinels: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
      explorers: ['ISTP', 'ISFP', 'ESTP', 'ESFP']
    },
    scoring: {
      itemScoring: 'Each item sampled 5 times, averaged on 1-5 scale',
      dimensionScoring: 'Sum of items per dimension, normalized',
      typeDerivation: 'Higher score determines preference letter (e.g., I vs E)',
      psi: 'Percentage distance from neutral (3.0) - higher = stronger preference'
    }
  });
}
