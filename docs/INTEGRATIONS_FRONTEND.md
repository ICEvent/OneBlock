# Third-party integrations frontend

Authenticated navigation exposes **Integrations** at `/integrations`, separately from legacy profile links. The UI uses the existing profile canister actor and generated Candid types; no sample applications or records are seeded.

## Supported workflow

1. Log in and create a profile in Console if necessary.
2. Open Integrations. Applications must already be registered by an administrator.
3. Enter the account ID used on the external application and explicit comma-separated activity scopes. Connect or update authorization.
4. Inspect imported records, filtering by application and activity type. Expand a record for payload, provenance, visibility, schema version, reported verification/signature status and source receipt.
5. Revoke access, then confirm. This stops future submissions through the current connection; stored records are retained.

The application principal is shown before authorization. Account IDs are user supplied, with no OAuth ownership verification. The current backend stores scopes without enforcing scope restrictions; the consent copy states this explicitly. A declared import policy or signature status does not constitute independently verified evidence. The page routes certified proof checks to Verify and does not treat the legacy activity hash as a cryptographic proof.

Exact `getConnection(profileId, appId)` reads avoid relying on older registries' potentially incomplete connection list indexes. Requests are invalidated on actor, account, filter and refresh changes. Connection read failures prevent authorization controls from being presented with unknown connection state. Receipt links allow absolute HTTP(S) URLs only; payloads render as escaped text.

## Validation

- `node --experimental-strip-types --test tests/integrations.test.mjs`
- `node --test tests/reactSingleton.test.mjs tests/viteBrowserGlobals.test.mjs tests/strictClaim.test.mjs tests/validateSourceClaim.test.mjs`
- `npx tsc -p src/oneblock_frontend/tsconfig.json --noEmit`
- `cd src/oneblock_frontend && npx vite build`
- `node scripts/harden-generated-agents.mjs --check`
- `npm audit --audit-level=moderate`

Browser interaction QA and authenticated canister end-to-end testing remain pending. Chromium could not launch in the execution environment (socket creation denied). Before merging, verify connect/update, persisted state after refresh, revoke cancel/confirm, filtering, switching accounts during pending reads, and the mobile layout against a local test deployment with registered applications.

Application registration, activity-schema administration, provider-side record submission and OAuth integrations are outside this user connection-management page.
