-- PROPOSED SCHEMA MIGRATION
-- This script checks if the 'runs' table exists and modifies it to match the application's needs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    -- 1. Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.runs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        model_name text NOT NULL,
        results jsonb NOT NULL
    );

    -- 2. Add missing columns if they don't exist (Idempotent changes)
    -- Add 'config' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='runs' AND column_name='config') THEN
        ALTER TABLE public.runs ADD COLUMN config jsonb;
    END IF;

    -- Add 'logs' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='runs' AND column_name='logs') THEN
        ALTER TABLE public.runs ADD COLUMN logs jsonb;
    END IF;

    -- Add 'persona' for System Prompts (New feature)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='runs' AND column_name='persona') THEN
        ALTER TABLE public.runs ADD COLUMN persona text;
    END IF;

    -- Add 'model_version' if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='runs' AND column_name='model_version') THEN
        ALTER TABLE public.runs ADD COLUMN model_version text;
    END IF;

    -- 3. Make columns nullable if they are not used in the current insert 
    ALTER TABLE public.runs ALTER COLUMN config DROP NOT NULL;
    
END $$;

-- 4. Ensure Policies exist (Drop and Recreate to be safe or use IF NOT EXISTS)

-- Enable RLS
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.runs;
CREATE POLICY "Allow anonymous inserts" ON public.runs FOR INSERT TO public WITH CHECK (true);

-- Policy: Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON public.runs;
CREATE POLICY "Allow public read access" ON public.runs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON public.runs; -- Remove old policy name if present

-- 5. Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS runs_model_name_idx ON public.runs (model_name);
CREATE INDEX IF NOT EXISTS runs_created_at_idx ON public.runs (created_at DESC);
CREATE INDEX IF NOT EXISTS runs_persona_idx ON public.runs (persona);
