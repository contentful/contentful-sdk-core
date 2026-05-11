# Upgrade Minimum Node.js Version to 22 (CI on 24)

## Status

Accepted

## Context

The Contentful public JS repos were standardizing on Node.js 24 for CI to stay current with the Node.js release schedule. The `engines.node` field was updated to `>=22` to give consumers one LTS version of runway while CI validates against the latest.

## Decision

- Set `engines.node` to `>=22` in `package.json`
- Run CI on Node 24
- Drop support for Node < 22

Evidence: commit `9e3a5be` (2026-05-01) — "feat!: upgrade to Node 24"

## Consequences

- Breaking change: consumers on Node < 22 must upgrade before adopting newer versions of this package
- Enables use of modern Node APIs without polyfills
- Aligns with Node.js LTS schedule (Node 22 is active LTS as of 2026)
