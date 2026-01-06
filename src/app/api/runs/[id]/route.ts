import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/runs/[id]
 * Fetch a specific psychometric analysis run by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 503 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Run ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Run not found' },
          { status: 404 }
        );
      }
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fetch run error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch run',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/runs/[id]
 * Delete a specific run by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 503 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Run ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Run deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete run error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete run',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
