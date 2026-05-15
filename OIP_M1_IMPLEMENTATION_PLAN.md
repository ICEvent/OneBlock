# OneBlock Open Identity Protocol (OIP) - M1 Implementation Plan

## Scope
This document defines a practical M1 implementation for OIP v0.1:
- probabilistic identity outputs
- dynamic factor lifecycle
- contextual policy evaluation

## Backend changes

### 1) Core data model (`src/oneblock_backend/types.mo`)
Add:
- `EntityKind`
- `FactorCategory`, `FactorStatus`, `Factor`
- `ProbabilityScores`
- `ContextPolicy` and requirements/weights
- `IdentityGraph`
- `FactorEvent` (history)

### 2) State persistence (`src/oneblock_backend/main.mo`)
Add stable+transient maps:
- `identityGraphs`
- `contextPolicies`

Wire maps into `preupgrade` / `postupgrade`.

### 3) M1 API surface
Add methods:
- `createIdentityGraph`
- `addFactor`
- `revokeFactor`
- `createPolicy`
- `recomputeScores`
- `getScores`
- `evaluatePolicy`

### 4) Scoring (M1)
Implement linear score aggregation:

`Final = Σ(confidence × categoryWeight × freshness × reliability)`

Outputs:
- `human_score`
- `uniqueness_score`
- `trust_score`
- `reputation_score`
- `ai_probability`
- `organization_probability`

### 5) Policy presets
Seed:
- `dao-voting`
- `finance-risk`

## Frontend changes

### 1) API wrappers
Create `src/oneblock_frontend/src/api/oip/index.ts`:
- `getScores`
- `recomputeScores`
- `evaluatePolicy`

### 2) UI
Create:
- `src/oneblock_frontend/src/components/ScoresOIP.tsx`
- `src/oneblock_frontend/src/pages/PolicyEval.tsx`
- optional `src/oneblock_frontend/src/pages/Identity.tsx`

### 3) Seed runner
Create `src/oneblock_frontend/src/lib/oipSeed.ts` for one-click demo data.

## M1 acceptance checklist
- identity graph creation succeeds
- factors can be added and revoked
- scores recompute to non-zero values with demo factors
- policy evaluation returns pass/fail + per-rule details
- frontend can display score bars and policy results

## Out of scope (M2+)
- exponential decay as default (`exp(-λt)`)
- trust-edge graph weighting
- provider marketplace and signed submission gateway
- anomaly/risk engine
