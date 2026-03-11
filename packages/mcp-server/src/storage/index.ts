/**
 * Storage factory - returns Supabase storage if configured, else local file storage.
 * @author Shreyas Jagannath
 */
import { LocalStorage } from './local.js';
import { SupabaseStorage } from './supabase.js';

export type { Storage, StoredRun, RunFilter } from './local.js';
export { LocalStorage } from './local.js';
export { SupabaseStorage } from './supabase.js';

export function createStorage(): LocalStorage | SupabaseStorage {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            return new SupabaseStorage(supabaseUrl, supabaseAnonKey);
        } catch {
            console.error('Supabase storage unavailable, falling back to local storage.');
        }
    }

    return new LocalStorage();
}
