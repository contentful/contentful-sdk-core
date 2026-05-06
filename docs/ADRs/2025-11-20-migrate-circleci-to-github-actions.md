# Migrate CI/CD from CircleCI to GitHub Actions

## Status

Accepted

## Context

The Contentful ecosystem repos were migrating from CircleCI to GitHub Actions to support trusted publishing (OIDC-based npm publishing without long-lived tokens). This aligned with a decision to consolidate CI on GitHub Actions.

## Decision

Replace the CircleCI pipeline with GitHub Actions reusable workflows:
- `build.yaml` — install, build, cache dist
- `check.yaml` — lint, format check, test with coverage
- `release.yaml` — semantic-release with OIDC trusted publishing
- `failure-notification.yaml` — alert on main branch failures

Evidence: commit `1264b27` / `7534bdc` (2025-11-20) — "chore(ci): migrate circleCI CI/CD to github actions to support trusted publishing to npmjs.com"

## Consequences

- npm publishing now uses OIDC trusted publishing (no long-lived NPM_TOKEN)
- Secrets are injected at CI runtime (no long-lived tokens stored in repo)
- CircleCI config removed entirely
- Workflow reuse pattern (workflow_call) keeps CI DRY across jobs
