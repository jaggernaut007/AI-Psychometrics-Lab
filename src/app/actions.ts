'use server'

import { supabase } from '@/lib/supabase';
import { ModelProfile } from '@/lib/psychometrics/types';

export async function saveRun(profile: ModelProfile) {
    if (!supabase) {
        return { success: false, error: 'Supabase is not configured' };
    }

    try {
        const { error } = await supabase
            .from('runs')
            .insert({
                model_name: profile.modelName,
                persona: profile.persona || 'Base Model', // Default to Base Model
                config: { systemPrompt: profile.systemPrompt }, // Save config
                results: profile.results,
                created_at: new Date(profile.timestamp).toISOString(),
            });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error saving run:', error);
        return { success: false, error: error.message };
    }
}
