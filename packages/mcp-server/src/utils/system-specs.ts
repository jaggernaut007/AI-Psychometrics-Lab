/**
 * System specification detection for hardware-aware model recommendations.
 * Detects RAM, CPU, and GPU information using os module and child_process.
 * @author Shreyas Jagannath
 */
import * as os from 'node:os';
import { execSync } from 'node:child_process';

export interface SystemSpecs {
    ram_gb: number;
    cpu_cores: number;
    cpu_model: string;
    gpu: { name: string; vram_gb: number } | null;
    os: string;
    arch: string;
}

function detectGPU(): { name: string; vram_gb: number } | null {
    const platform = os.platform();

    if (platform === 'darwin') {
        try {
            const output = execSync('system_profiler SPDisplaysDataType', {
                encoding: 'utf-8',
                timeout: 10_000,
            });

            // Parse chipset/GPU name
            const chipsetMatch = output.match(/Chipset Model:\s*(.+)/i);
            const name = chipsetMatch?.[1]?.trim() ?? 'Unknown GPU';

            // Parse VRAM - try explicit VRAM first, then total memory for Apple Silicon
            const vramMatch = output.match(/VRAM.*?:\s*(\d+)\s*(MB|GB)/i);
            let vram_gb = 0;
            if (vramMatch) {
                const value = parseInt(vramMatch[1]);
                vram_gb = vramMatch[2].toUpperCase() === 'GB' ? value : value / 1024;
            } else {
                // Apple Silicon uses unified memory; report total system RAM as shared GPU memory
                const totalMemMatch = output.match(/Total Number of Cores.*?Memory.*?(\d+)\s*GB/i);
                if (!totalMemMatch) {
                    // For Apple Silicon, the GPU shares system RAM
                    vram_gb = Math.round(os.totalmem() / (1024 * 1024 * 1024));
                } else {
                    vram_gb = parseInt(totalMemMatch[1]);
                }
            }

            return { name, vram_gb };
        } catch {
            return null;
        }
    }

    if (platform === 'linux') {
        try {
            const output = execSync(
                'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits',
                { encoding: 'utf-8', timeout: 10_000 }
            );

            const line = output.trim().split('\n')[0];
            if (line) {
                const parts = line.split(',').map(s => s.trim());
                const name = parts[0] ?? 'Unknown GPU';
                const vram_mb = parseInt(parts[1] ?? '0');
                return { name, vram_gb: Math.round(vram_mb / 1024) };
            }
        } catch {
            // nvidia-smi not available or no NVIDIA GPU
        }

        // Try lspci as fallback for non-NVIDIA GPUs
        try {
            const output = execSync("lspci | grep -i 'vga\\|3d'", {
                encoding: 'utf-8',
                timeout: 5_000,
            });
            const match = output.match(/:\s*(.+)/);
            if (match) {
                return { name: match[1].trim(), vram_gb: 0 };
            }
        } catch {
            // No GPU detected
        }
    }

    return null;
}

export function getSystemSpecs(): SystemSpecs {
    const cpus = os.cpus();
    return {
        ram_gb: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
        cpu_cores: cpus.length,
        cpu_model: cpus[0]?.model ?? 'Unknown',
        gpu: detectGPU(),
        os: os.platform(),
        arch: os.arch(),
    };
}
