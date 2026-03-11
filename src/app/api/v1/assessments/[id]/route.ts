/**
 * GET /api/v1/assessments/[id] - Retrieve a specific assessment by UUID
 *
 * @author Shreyas Jagannath
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!supabase) {
      return apiError('server_error', 'Database Unavailable', 503, 'Supabase is not configured.');
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return apiError('validation_error', 'Invalid ID', 400, 'The assessment ID must be a valid UUID.');
    }

    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return apiError('not_found', 'Assessment Not Found', 404, `No assessment found with id: ${id}`);
    }

    // Determine status based on whether results are populated
    const hasResults = data.results && Object.keys(data.results).length > 0;
    const hasError = data.results?.error;
    const status = hasError ? 'failed' : hasResults ? 'completed' : 'running';

    return apiSuccess({
      ...data,
      status,
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
