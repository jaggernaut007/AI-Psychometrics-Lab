/**
 * Tests for system specification detection.
 * @author Shreyas Jagannath
 */
import { describe, it, expect, vi } from 'vitest';
import { getSystemSpecs } from '../src/utils/system-specs.js';

describe('System Specs', () => {
    it('should return valid system specs', () => {
        const specs = getSystemSpecs();

        expect(specs.ram_gb).toBeGreaterThan(0);
        expect(specs.cpu_cores).toBeGreaterThan(0);
        expect(specs.cpu_model).toBeTruthy();
        expect(specs.os).toBeTruthy();
        expect(specs.arch).toBeTruthy();
        expect(['darwin', 'linux', 'win32']).toContain(specs.os);
    });

    it('should return ram_gb as a rounded number', () => {
        const specs = getSystemSpecs();
        expect(Number.isInteger(specs.ram_gb)).toBe(true);
    });

    it('should detect GPU or return null', () => {
        const specs = getSystemSpecs();
        if (specs.gpu) {
            expect(specs.gpu.name).toBeTruthy();
            expect(typeof specs.gpu.vram_gb).toBe('number');
        } else {
            expect(specs.gpu).toBeNull();
        }
    });
});
