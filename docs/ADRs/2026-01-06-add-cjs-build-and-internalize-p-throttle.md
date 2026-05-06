# Add CJS Build Output and Internalize p-throttle

## Status

Accepted

## Context

After the ESM-only migration (ADR 2024-03-20), some consumers still needed a CommonJS entry point from this package directly — rather than relying solely on downstream SDK bundling. Re-introducing a CJS build required a bundler since the codebase uses ESM internally.

The external `p-throttle` package was ESM-only with no CJS export, making it impossible to include in a CJS bundle without modification. Additionally, depending on an external package for a critical rate-limiting path introduced supply-chain risk and limited control over the implementation.

## Decision

1. Migrate the build system to Rollup, producing three outputs: ESM (preserveModules), CJS (single bundle), and type declarations.
2. Internalize the `p-throttle` implementation as `src/pThrottle.ts` — a direct copy of the library's logic, enabling it to be bundled into both ESM and CJS outputs.

Evidence: commit `0bdba25` (2026-01-06) — "feat: add commonjs build output [DX-628]"

## Consequences

- Package now ships dual ESM + CJS, improving compatibility for consumers not using modern bundlers
- Internalized throttle code is now owned by the team — any upstream `p-throttle` bugs or API changes are irrelevant
- Build complexity increased (Rollup config with three output targets)
- The `main` field points to `dist/cjs/index.cjs`; `module` field points to `dist/index.js`
