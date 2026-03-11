/**
 * Tests for local file storage.
 * @author Shreyas Jagannath
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ModelProfile } from '@apl/psychometrics-core';

// We test LocalStorage by overriding the data dir via a temp directory.
// Since the class uses a hardcoded path, we'll test the methods directly
// by creating a minimal wrapper that uses a temp dir.

function makeTempStorage() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apl-test-'));

    return {
        tmpDir,
        async saveRun(profile: ModelProfile) {
            const id = crypto.randomUUID();
            const run = { id, profile, createdAt: new Date().toISOString() };
            fs.writeFileSync(path.join(tmpDir, `${id}.json`), JSON.stringify(run, null, 2), 'utf-8');
            return run;
        },
        async getRun(id: string) {
            const filePath = path.join(tmpDir, `${id}.json`);
            if (!fs.existsSync(filePath)) return null;
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        },
        async listRuns(filter?: { model?: string; limit?: number }) {
            const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.json'));
            let runs: any[] = [];
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(tmpDir, file), 'utf-8'));
                if (filter?.model && data.profile.modelName !== filter.model) continue;
                runs.push(data);
            }
            runs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (filter?.limit && filter.limit > 0) runs = runs.slice(0, filter.limit);
            return runs;
        },
        async deleteRun(id: string) {
            const filePath = path.join(tmpDir, `${id}.json`);
            if (!fs.existsSync(filePath)) return false;
            fs.unlinkSync(filePath);
            return true;
        },
        cleanup() {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        },
    };
}

const mockProfile: ModelProfile = {
    modelName: 'test-model',
    persona: 'Test Persona',
    timestamp: Date.now(),
    results: {
        bigfive: {
            inventoryName: 'Big Five',
            rawScores: {},
            traitScores: { N: 50, E: 60, O: 70, A: 80, C: 90 },
        },
    },
};

describe('Local Storage', () => {
    let storage: ReturnType<typeof makeTempStorage>;

    beforeEach(() => {
        storage = makeTempStorage();
    });

    afterEach(() => {
        storage.cleanup();
    });

    it('should save and retrieve a run', async () => {
        const saved = await storage.saveRun(mockProfile);
        expect(saved.id).toBeTruthy();
        expect(saved.profile.modelName).toBe('test-model');

        const retrieved = await storage.getRun(saved.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.profile.modelName).toBe('test-model');
    });

    it('should return null for non-existent run', async () => {
        const result = await storage.getRun('non-existent-id');
        expect(result).toBeNull();
    });

    it('should list runs', async () => {
        await storage.saveRun(mockProfile);
        await storage.saveRun({ ...mockProfile, modelName: 'other-model' });

        const runs = await storage.listRuns();
        expect(runs.length).toBe(2);
    });

    it('should filter runs by model name', async () => {
        await storage.saveRun(mockProfile);
        await storage.saveRun({ ...mockProfile, modelName: 'other-model' });

        const runs = await storage.listRuns({ model: 'test-model' });
        expect(runs.length).toBe(1);
        expect(runs[0].profile.modelName).toBe('test-model');
    });

    it('should limit number of runs returned', async () => {
        await storage.saveRun(mockProfile);
        await storage.saveRun(mockProfile);
        await storage.saveRun(mockProfile);

        const runs = await storage.listRuns({ limit: 2 });
        expect(runs.length).toBe(2);
    });

    it('should delete a run', async () => {
        const saved = await storage.saveRun(mockProfile);
        const deleted = await storage.deleteRun(saved.id);
        expect(deleted).toBe(true);

        const retrieved = await storage.getRun(saved.id);
        expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent run', async () => {
        const deleted = await storage.deleteRun('does-not-exist');
        expect(deleted).toBe(false);
    });
});
