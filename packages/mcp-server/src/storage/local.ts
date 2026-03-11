/**
 * Local file-based storage for psychometric assessment results.
 * Saves/loads ModelProfiles as JSON files in ~/.ai-psychometrics/data/
 * @author Shreyas Jagannath
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import type { ModelProfile } from '@apl/psychometrics-core';

export interface StoredRun {
    id: string;
    profile: ModelProfile;
    createdAt: string;
}

export interface RunFilter {
    model?: string;
    limit?: number;
}

export interface Storage {
    saveRun(profile: ModelProfile): Promise<StoredRun>;
    getRun(id: string): Promise<StoredRun | null>;
    listRuns(filter?: RunFilter): Promise<StoredRun[]>;
    deleteRun(id: string): Promise<boolean>;
}

const DATA_DIR = path.join(os.homedir(), '.ai-psychometrics', 'data');

function ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function runFilePath(id: string): string {
    // Sanitize ID to prevent path traversal
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    if (safeId !== id) {
        throw new Error(`Invalid run ID: ${id}`);
    }
    return path.join(DATA_DIR, `${safeId}.json`);
}

export class LocalStorage implements Storage {
    async saveRun(profile: ModelProfile): Promise<StoredRun> {
        ensureDataDir();
        const id = crypto.randomUUID();
        const run: StoredRun = {
            id,
            profile,
            createdAt: new Date().toISOString(),
        };
        fs.writeFileSync(runFilePath(id), JSON.stringify(run, null, 2), 'utf-8');
        return run;
    }

    async getRun(id: string): Promise<StoredRun | null> {
        ensureDataDir();
        const filePath = runFilePath(id);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data) as StoredRun;
    }

    async listRuns(filter?: RunFilter): Promise<StoredRun[]> {
        ensureDataDir();
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        const runs: StoredRun[] = [];

        for (const file of files) {
            try {
                const data = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
                const run = JSON.parse(data) as StoredRun;
                if (filter?.model && run.profile.modelName !== filter.model) {
                    continue;
                }
                runs.push(run);
            } catch {
                // Skip malformed files
            }
        }

        // Sort by creation date, newest first
        runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Truncate to limit and free excess references
        if (filter?.limit && filter.limit > 0) {
            runs.length = Math.min(runs.length, filter.limit);
        }

        return runs;
    }

    async deleteRun(id: string): Promise<boolean> {
        ensureDataDir();
        const filePath = runFilePath(id);
        if (!fs.existsSync(filePath)) {
            return false;
        }
        fs.unlinkSync(filePath);
        return true;
    }
}
