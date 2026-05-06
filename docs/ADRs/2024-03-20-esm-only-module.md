# ESM-Only Module with Vitest

## Status

Superseded (by ADR 2026-01-06 — CJS build re-added)

## Context

The library was originally bundled with Rollup and tested with Jest. As the JavaScript ecosystem moved toward native ES modules, the upstream `p-throttle` dependency became ESM-only, and Jest's ESM support remained experimental and unreliable.

The team needed to decide whether to maintain CJS compatibility at the `contentful-sdk-core` level or push that responsibility to downstream SDKs.

## Decision

Convert `contentful-sdk-core` to an ESM-only module (`"type": "module"` in `package.json`), remove all bundling (ship raw TypeScript compiler output), and replace Jest with Vitest for native ESM test support.

CJS compatibility was delegated to the downstream SDKs (`contentful.js`, `contentful-management.js`) which bundle their own output.

Evidence: commit `63672e1` (2024-03-20) — "refactor: turn into ESM only module without bundles and replace Jest with Vitest - providing CJS variants will now be responsibility of our actual SDKs"

## Consequences

- Simplified the build pipeline (no Rollup, no Babel)
- Vitest provided faster test execution and native ESM/TypeScript support
- Downstream SDKs took on the responsibility of producing CJS bundles
- Later reversed partially when a CJS build was re-added (see ADR 2026-01-06)
