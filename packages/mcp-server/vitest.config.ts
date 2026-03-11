import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        include: ['__tests__/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@apl/psychometrics-core': path.resolve(__dirname, '../psychometrics-core/src/index.ts'),
        },
    },
});
