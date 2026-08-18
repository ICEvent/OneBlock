# OneBlock Protocol V1

## Purpose

OneBlock is an open protocol for building a verifiable graph of human activity.

The protocol does not attempt to model every domain. Applications such as ICEvent and Alltracks remain the systems of record for their domain data. OneBlock records compact, verifiable claims about activity and connects those claims into a personal chronology and a global graph.

## Design principles

1. **Evidence, not duplicated application state.** Store references and cryptographic commitments instead of copying complete event, GPS, payment, or credential records.
2. **Subject and issuer are distinct.** A block states what an issuer claims about a subject.
3. **Chain + graph.** `previous` preserves personal chronology; `links` connect related people, events, journeys, organizations, credentials, and other objects.
4. **Open semantics.** A small universal action vocabulary can coexist with namespaced application actions.
5. **Trust is contextual.** OneBlock exposes provenance and verification information; users and agents decide which issuers to trust.
6. **Self-attestation is allowed but explicit.** Self-issued claims are not equivalent to app-, institution-, or cryptographically verified claims.
7. **Protocol core stays small.** Derived traits, probability scores, search indexes, recommendations, and LLM reasoning belong above the core protocol.

## Core block

Conceptual V1 structure:

```text
Block {
  version
  id
  previous
  subject
  issuer
  action
  object
  timestamp
  evidence
  links
  signature
}
```

### Identity

- `subject`: principal/entity the claim is about.
- `issuer`: principal/provider making the claim.

Example: Alltracks can attest that a user completed a journey. The user is the subject; the Alltracks canister is the issuer.

### Action

Prefer a small common vocabulary such as:

- `created`
- `completed`
- `attended`
- `organized`
- `issued`
- `received`
- `transferred`
- `published`
- `contributed`
- `verified`
- `endorsed`
- `achieved`

Applications may extend it with namespaced actions such as `alltracks:climbed`, `github:merged`, or `icevent:hosted`.

### Object reference

Objects are referenced rather than embedded:

```text
{
  object_type: "journey",
  uri: "ic://alltracks/journey/8291"
}
```

The protocol should not need to know the internal Journey schema.

### Evidence

Evidence contains at least:

```text
{
  schema: "alltracks.journey.v1",
  reference: "ic://alltracks/journey/8291",
  hash: <cryptographic commitment>
}
```

Large source records remain with the application or archival layer. The hash allows later evidence to be checked against the claim even when storage is external.

### Block ID

The target design is content-addressed:

```text
block_id = hash(canonical_block_header)
```

Changing subject, issuer, action, object, timestamp, evidence commitment, previous block, or other committed header fields must change the block ID.

## Chain and graph

`previous` links the block to the subject's prior accepted block and provides chronological continuity.

`links` provide graph relationships. A completed journey block might link to an event, organization, achievement, route, or other participants.

The result is both:

- a **personal chain** for historical continuity; and
- a **global activity graph** for relationships and discovery.

## Registry layer

The protocol should support registries without hard-coding every application domain into the core.

### Issuer registry

Records issuer identity, ownership/authority, supported schemas, verification method, status, and related metadata.

### Schema registry

Examples:

- `alltracks.journey.v1`
- `icevent.event.v1`
- `github.contribution.v1`
- `education.credential.v1`

A schema defines how referenced evidence is interpreted and verified; it does not require OneBlock Core to store all domain fields.

## Verification classes

At minimum, consumers should be able to distinguish:

- self-attested
- application-attested
- institution-attested
- cryptographically verified

OneBlock should expose provenance rather than collapsing these into a single global truth score.

## Layered architecture

```text
Applications / Oracles
  ICEvent | Alltracks | future providers
             |
             v
OneBlock Protocol Core
  blocks | evidence commitments | chronology | links
             |
             v
Registry / Index / Graph
  issuers | schemas | indexes | relationships | derived views
             |
             v
Agent / MCP
  query | reason | recommend | verify | execute
```

LLMs and probabilistic identity models must remain outside protocol consensus. They consume the graph and produce derived interpretations that can be recomputed.

## V1 scope

V1 should deliberately stay small:

1. Block
2. Subject
3. Issuer
4. Action
5. Object reference
6. Timestamp
7. Evidence commitment
8. Previous block
9. Signature/provenance
10. Links

Initial real issuers should be ICEvent and Alltracks. Other integrations should prove that they can use the protocol without requiring changes to the core block format.

## Migration from the current implementation

The existing OneBlock code already contains Block, ActivityRecord, IntegrationApp, provider, factor, and identity-graph concepts. Protocol V1 should evolve these rather than discard them.

Recommended migration sequence:

1. Introduce V1 protocol types alongside existing types.
2. Map existing `ActivityRecord` submissions into V1 claims/blocks.
3. Add issuer and schema registry semantics around existing integration apps/providers.
4. Implement canonical serialization and content-addressed block IDs.
5. Implement per-subject `previous` validation.
6. Add graph links and indexes as rebuildable derived state.
7. Adapt ICEvent and Alltracks as the first issuer integrations.
8. Keep existing traits, probability scores, and OIP identity models as derived intelligence above the immutable evidence layer.

This separation makes the immutable activity/evidence layer the source of truth while allowing identity models and agents to evolve independently.