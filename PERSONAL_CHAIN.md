# OneBlock Personal Chain

This branch introduces the first executable version of OneBlock as a personal append-only chain.

## Model

Each authenticated principal owns one ordered chain. Every block commits to the previous block through `previous_block_id` and includes the previous block hash in the block commitment.

A block represents an externally observable action rather than a user-authored profile statement:

- `journey` groups blocks into life/project journeys without creating separate chains.
- `source` identifies the application/provider and its external event ID.
- `action` describes what happened.
- `proof` records the evidence class: self, device, app, peer, institution, or onchain.
- `content` references off-chain/canister content by URI + hash.
- `payload_hash` commits to the source payload without storing arbitrary payload data in the ledger.
- `block_hash` commits to owner, previous chain head, time, journey, source, action, proof metadata, and payload hash.

## API

- `append(NewBlock)` — append an immutable event to the caller's chain.
- `getBlock(id)` — retrieve one block.
- `getChain(owner)` — retrieve the ordered personal chain.
- `getJourney(owner, journey)` — project the chain by journey.
- `getHead(owner)` — retrieve the current chain commitment and height.
- `verifyChain(owner)` — verify stored predecessor linkage.

## Source event idempotency

`owner + app_id + external_id` is unique. A provider event cannot be appended twice for the same owner.

## Architecture direction

The canister is intentionally separate from the legacy `profile` canister for the first migration step. This lets the chain protocol stabilize without breaking existing profile/block Candid interfaces. The next step is to route verified Integration `ActivityRecord`s into this append-only ledger and then derive profile/traits/reputation from the ledger rather than treating them as primary state.

## Cryptography note

The current `commit()` function is a deterministic prototype commitment based on Motoko `Text.hash`; it is **not cryptographically secure**. Before production anchoring, replace it with SHA-256 (or another canonical cryptographic hash), define canonical serialization, verify provider signatures, and periodically anchor chain heads/Merkle roots to the Internet Computer certified state and/or an external public chain.
