# Contributing

## Project Structure

This is a monorepo using npm workspaces:

```
├── src/                          # Next.js web application
│   ├── app/api/v1/               # Public REST API (v1)
│   ├── lib/psychometrics/        # Re-exports from @apl/psychometrics-core
│   └── __tests__/                # App-level tests
├── packages/
│   ├── psychometrics-core/       # Shared assessment engine (@apl/psychometrics-core)
│   └── mcp-server/               # MCP server (@apl/mcp-server)
```

## Development

```bash
# Install all dependencies (root + workspace packages)
npm install

# Run the Next.js dev server
npm run dev

# Build the shared package (required before first run)
cd packages/psychometrics-core && npm run build

# Build the MCP server
cd packages/mcp-server && npm run build

# Lint
npm run lint
```

## Testing

```bash
# Run all tests (root + workspace packages)
npx vitest run

# Run tests for a specific package
npx vitest run packages/psychometrics-core
npx vitest run packages/mcp-server
npx vitest run src/__tests__

# Watch mode
npx vitest
```

## Pull Requests

- Keep changes focused and minimal.
- Update documentation when behavior or setup changes.
- Prefer small PRs that are easy to review.
- Ensure all tests pass (`npx vitest run`) before submitting.
- If adding a new inventory or API endpoint, include tests.

## API Development

- **v1 API endpoints** live in `src/app/api/v1/` and require auth via `APL_API_KEY` env var.
- **Public endpoints** (inventories, docs) are exempted in `src/middleware.ts`.
- Response format uses the envelope pattern from `src/lib/api-response.ts`.

## MCP Server Development

- Tools are registered in `packages/mcp-server/src/index.ts`.
- Each tool lives in its own file under `src/tools/`.
- Test with `npx tsx packages/mcp-server/src/index.ts` (stdio transport).

## Issues

If you're filing a bug report, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser + OS
- Console output / logs (redact any keys)
