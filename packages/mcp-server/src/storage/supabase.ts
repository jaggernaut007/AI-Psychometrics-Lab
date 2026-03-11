/**
 * Supabase-backed storage for psychometric assessment results.
 * Only used when SUPABASE_URL and SUPABASE_ANON_KEY env vars are set.
 * @author Shreyas Jagannath
 */
import * as crypto from 'node:crypto';
import type { ModelProfile } from '@apl/psychometrics-core';
import type { Storage, StoredRun, RunFilter } from './local.js';

export class SupabaseStorage implements Storage {
    private client: any;
    private initialized: boolean = false;
    private supabaseUrl: string;
    private supabaseAnonKey: string;

    constructor(supabaseUrl: string, supabaseAnonKey: string) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseAnonKey = supabaseAnonKey;
    }

    private async ensureClient(): Promise<void> {
        if (this.initialized) return;
        try {
            const { createClient } = await import('@supabase/supabase-js');
            this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
            this.initialized = true;
        } catch {
            throw new Error(
                'Supabase storage requires @supabase/supabase-js. ' +
                'Install it with: npm install @supabase/supabase-js'
            );
        }
    }

    async saveRun(profile: ModelProfile): Promise<StoredRun> {
        await this.ensureClient();
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const { error } = await this.client
            .from('assessment_runs')
            .insert({
                id,
                model_name: profile.modelName,
                persona: profile.persona,
                profile: profile,
                created_at: createdAt,
            });

        if (error) {
            throw new Error(`Supabase insert error: ${error.message}`);
        }

        return { id, profile, createdAt };
    }

    async getRun(id: string): Promise<StoredRun | null> {
        await this.ensureClient();
        const { data, error } = await this.client
            .from('assessment_runs')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            profile: data.profile as ModelProfile,
            createdAt: data.created_at,
        };
    }

    async listRuns(filter?: RunFilter): Promise<StoredRun[]> {
        await this.ensureClient();
        let query = this.client
            .from('assessment_runs')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter?.model) {
            query = query.eq('model_name', filter.model);
        }

        if (filter?.limit && filter.limit > 0) {
            query = query.limit(filter.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Supabase query error: ${error.message}`);
        }

        return (data ?? []).map((row: any) => ({
            id: row.id,
            profile: row.profile as ModelProfile,
            createdAt: row.created_at,
        }));
    }

    async deleteRun(id: string): Promise<boolean> {
        await this.ensureClient();
        const { error, count } = await this.client
            .from('assessment_runs')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Supabase delete error: ${error.message}`);
        }

        return (count ?? 0) > 0;
    }
}
