/**
 * POST /api/v1/assessments - Start a new psychometric assessment
 * GET  /api/v1/assessments - List assessments with pagination and filtering
 *
 * @author Shreyas Jagannath
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, apiPaginatedSuccess, apiError } from '@/lib/api-response';
import {
  createOpenRouterBackend,
  runAssessment,
  validateInventories,
  INVENTORY_METADATA,
} from '@apl/psychometrics-core';

/**
 * POST /api/v1/assessments
 * Start a new assessment. The assessment runs asynchronously (fire-and-forget)
 * and results are saved to Supabase when complete.
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return apiError('server_error', 'Database Unavailable', 503, 'Supabase is not configured.');
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return apiError('validation_error', 'Invalid Request Body', 400, 'Request body must be valid JSON.');
    }

    const { model, inventories, persona, systemPrompt, openrouterApiKey } = body;

    // Validate required fields
    if (!model || typeof model !== 'string') {
      return apiError('validation_error', 'Missing Model', 400, 'The "model" field is required and must be a string.');
    }

    if (!inventories || !Array.isArray(inventories) || inventories.length === 0) {
      return apiError(
        'validation_error',
        'Missing Inventories',
        400,
        'The "inventories" field is required and must be a non-empty array.',
      );
    }

    // Validate inventory names
    const invalid = validateInventories(inventories);
    if (invalid.length > 0) {
      const validNames = Object.keys(INVENTORY_METADATA).join(', ');
      return apiError(
        'validation_error',
        'Invalid Inventories',
        400,
        `Invalid inventory names: ${invalid.join(', ')}. Valid options: ${validNames}`,
      );
    }

    // Resolve API key
    const apiKey = openrouterApiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      return apiError(
        'configuration_error',
        'Missing OpenRouter API Key',
        400,
        'Provide "openrouterApiKey" in the request body or set NEXT_PUBLIC_OPENROUTER_API_KEY on the server.',
      );
    }

    // Create a placeholder row in Supabase so we have an ID immediately
    const { data: run, error: insertError } = await supabase
      .from('runs')
      .insert({
        model_name: model,
        persona: persona || 'Base Model',
        config: { systemPrompt: systemPrompt || '', inventories, source: 'api_v1' },
        results: {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !run) {
      return apiError('server_error', 'Database Error', 500, insertError?.message || 'Failed to create assessment run.');
    }

    // Estimate time based on total items
    const totalItems = inventories.reduce((sum: number, inv: string) => {
      const meta = INVENTORY_METADATA[inv as keyof typeof INVENTORY_METADATA];
      return sum + (meta ? meta.itemCount : 0);
    }, 0);
    const estimatedSeconds = Math.ceil((totalItems * 5 * 2) / 3); // 5 samples, ~2s per request, 3 concurrent

    // Fire-and-forget: run the assessment in the background
    const backend = createOpenRouterBackend({ apiKey, model });

    runAssessment(backend, {
      model,
      inventories,
      persona: persona || 'Base Model',
      systemPrompt: systemPrompt || '',
    })
      .then(async (profile) => {
        // Update the run with results
        await supabase
          .from('runs')
          .update({
            results: profile.results,
            logs: profile.logs,
          })
          .eq('id', run.id);
      })
      .catch(async (err) => {
        // Record the error
        await supabase
          .from('runs')
          .update({
            results: { error: err instanceof Error ? err.message : String(err) },
            logs: [{ timestamp: new Date().toISOString(), message: `Assessment failed: ${err}`, type: 'error' }],
          })
          .eq('id', run.id);
      });

    return apiSuccess(
      {
        id: run.id,
        status: 'running',
        estimatedTime: `${estimatedSeconds}s`,
      },
      202,
    );
  } catch (error) {
    return apiError(
      'server_error',
      'Internal Server Error',
      500,
      error instanceof Error ? error.message : 'An unexpected error occurred.',
    );
  }
}

/**
 * GET /api/v1/assessments
 * List assessments with optional filtering and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return apiError('server_error', 'Database Unavailable', 503, 'Supabase is not configured.');
    }

    const { searchParams } = new URL(request.url);
    const modelFilter = searchParams.get('model');
    const personaFilter = searchParams.get('persona');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

    let query = supabase
      .from('runs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (modelFilter) {
      query = query.ilike('model_name', `%${modelFilter}%`);
    }

    if (personaFilter) {
      query = query.eq('persona', personaFilter);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return apiError('server_error', 'Database Error', 500, error.message);
    }

    return apiPaginatedSuccess(data || [], {
      limit,
      offset,
      total: count ?? data?.length ?? 0,
    });
  } catch (error) {
    return apiError(
      'server_error',
      'Internal Server Error',
      500,
      error instanceof Error ? error.message : 'An unexpected error occurred.',
    );
  }
}
