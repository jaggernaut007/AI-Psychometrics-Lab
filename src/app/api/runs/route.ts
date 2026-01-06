import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/runs
 * Fetch psychometric analysis runs from database
 * 
 * Query parameters:
 * - model: Filter by model name (partial match)
 * - persona: Filter by persona
 * - limit: Number of results (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const modelFilter = searchParams.get('model');
    const personaFilter = searchParams.get('persona');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('runs')
      .select('*')
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
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        total: count || data?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fetch runs error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch runs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/runs
 * Manually save a psychometric profile to database
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { modelName, persona, systemPrompt, results, timestamp } = body;

    if (!modelName || !results) {
      return NextResponse.json(
        { success: false, error: 'modelName and results are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('runs')
      .insert({
        model_name: modelName,
        persona: persona || 'Base Model',
        config: { systemPrompt },
        results,
        created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Run saved successfully',
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save run error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save run',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
