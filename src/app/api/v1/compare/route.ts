/**
 * POST /api/v1/compare - Compare psychometric profiles across runs or models
 *
 * @author Gordon Olson, Shreyas Jagannath
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiSuccess, apiError } from '@/lib/api-response';

interface TraitDelta {
  trait: string;
  values: Record<string, number>;
  delta: number;
  min: number;
  max: number;
}

interface InventoryComparison {
  inventory: string;
  traits: TraitDelta[];
}

/**
 * Compute trait-by-trait comparison across multiple runs for a given inventory.
 */
function compareInventory(
  inventoryKey: string,
  runs: Array<{ id: string; model_name: string; results: Record<string, any> }>,
): InventoryComparison | null {
  const traitsMap: Record<string, Record<string, number>> = {};

  for (const run of runs) {
    const inventoryResult = run.results?.[inventoryKey];
    if (!inventoryResult?.traitScores) continue;

    const label = `${run.model_name} (${run.id.slice(0, 8)})`;

    for (const [trait, score] of Object.entries(inventoryResult.traitScores)) {
      if (typeof score !== 'number') continue;
      // Guard against prototype pollution via user-controlled keys
      if (trait === '__proto__' || trait === 'constructor' || trait === 'prototype') continue;
      if (!Object.prototype.hasOwnProperty.call(traitsMap, trait)) traitsMap[trait] = {};
      traitsMap[trait][label] = score;
    }
  }

  const traitKeys = Object.keys(traitsMap);
  if (traitKeys.length === 0) return null;

  const traits: TraitDelta[] = traitKeys.map((trait) => {
    const values = traitsMap[trait];
    const nums = Object.values(values);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return {
      trait,
      values,
      delta: Math.round((max - min) * 100) / 100,
      min,
      max,
    };
  });

  return { inventory: inventoryKey, traits };
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return apiError('server_error', 'Database Unavailable', 503, 'Supabase is not configured.');
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return apiError('validation_error', 'Invalid Request Body', 400, 'Request body must be valid JSON.');
    }

    const { runIds, models } = body;

    if (!runIds && !models) {
      return apiError(
        'validation_error',
        'Missing Parameters',
        400,
        'Provide "runIds" (array of UUIDs) and/or "models" (array of model name strings).',
      );
    }

    let runs: any[] = [];

    if (runIds && Array.isArray(runIds) && runIds.length > 0) {
      // Validate runIds are UUID strings to prevent injection
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = runIds.filter((id: unknown) => typeof id === 'string' && uuidRegex.test(id));
      if (validIds.length === 0) {
        return apiError('validation_error', 'Invalid Run IDs', 400, 'runIds must contain valid UUIDs.');
      }
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .in('id', validIds);

      if (error) {
        return apiError('server_error', 'Database Error', 500, error.message);
      }
      runs = data || [];
    }

    if (models && Array.isArray(models) && models.length > 0) {
      // For each model, fetch the most recent run
      for (const model of models) {
        if (typeof model !== 'string' || model.length > 200) continue;
        // Escape special LIKE characters to prevent pattern injection
        const safeModel = model.replace(/[%_\\]/g, '\\$&');
        const { data, error } = await supabase
          .from('runs')
          .select('*')
          .ilike('model_name', `%${safeModel}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          // Avoid duplicates
          const existing = runs.find((r: any) => r.id === data[0].id);
          if (!existing) {
            runs.push(data[0]);
          }
        }
      }
    }

    if (runs.length < 2) {
      return apiError(
        'validation_error',
        'Insufficient Data',
        400,
        `Need at least 2 runs to compare. Found ${runs.length}.`,
      );
    }

    // Collect all inventory keys across runs
    const allInventoryKeys = new Set<string>();
    for (const run of runs) {
      if (run.results && typeof run.results === 'object') {
        for (const key of Object.keys(run.results)) {
          if (key !== 'error') allInventoryKeys.add(key);
        }
      }
    }

    const comparisons: InventoryComparison[] = [];
    for (const inventoryKey of allInventoryKeys) {
      const comparison = compareInventory(inventoryKey, runs);
      if (comparison) comparisons.push(comparison);
    }

    return apiSuccess({
      runCount: runs.length,
      runs: runs.map((r: any) => ({
        id: r.id,
        model: r.model_name,
        persona: r.persona,
        createdAt: r.created_at,
      })),
      comparisons,
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
