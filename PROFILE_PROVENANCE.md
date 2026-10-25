# OneBlock Profile Provenance Model

## Goal

OneBlock represents a person through claims and evidence from multiple sources without collapsing them into a global score.

Every profile fact must answer three questions:

1. **Who says this?**
2. **What evidence supports it?**
3. **How was it verified?**

## Four provenance classes

### 1. Self-declared

User-authored profile data such as bio, experience, skills, projects, education, portfolio entries, and service descriptions.

Semantics:

```text
I claim X about myself.
```

Self-declared data is useful, but must remain visibly distinguishable from verified evidence.

### 2. External

Claims issued or imported from another platform, institution, device, application, or on-chain source.

Examples:

- GitHub contribution history
- ICEvent completed services
- Alltracks journeys
- university credentials
- professional licenses
- DAO participation

Verification can progressively strengthen from imported data to OAuth-bound data to cryptographically signed attestations.

### 3. Peer

Structured attestations made by another OneBlock identity.

Peer review is contextual. OneBlock should not reduce a person to a global star rating.

A review should normally include:

- reviewer
- relationship to subject
- context
- capability path when applicable
- assessment tags
- optional narrative
- evidence / related transaction / event
- dispute or response state

### 4. Derived

Recomputable signals produced from existing claims and reviews.

Examples:

- number of verified completed jobs
- recent activity consistency
- experience duration supported by evidence
- capability evidence density
- freshness indicators

Derived signals are not immutable truth and do not belong in protocol consensus. They must retain their source claim IDs, model/method name, version, and computation time.

## Capability paths

Capabilities use open hierarchical paths rather than a fixed global enumeration.

Examples:

```text
landscaping
landscaping.hedge_trimming
coding.react
coding.motoko
hiking.long_distance
```

A capability can be introduced by applications or users without a protocol upgrade. Registry/alias tooling can later normalize equivalent paths.

## Claim model

Conceptually:

```text
ProfileClaim {
  subject
  predicate
  value
  capability?
  context?
  provenance
  validity?
}
```

Provenance records:

```text
Provenance {
  source_kind
  issuer
  verification
  evidence[]
  observed_at
  recorded_at
}
```

The important separation is:

```text
source kind != verification strength
```

For example, an external claim may merely be imported, OAuth verified, signed, institutional, or on-chain.

## Peer review model

Reviews are capability/context attestations rather than popularity scores:

```text
PeerReview {
  subject
  reviewer
  relationship
  capability?
  context
  assessment_tags[]
  narrative?
  evidence[]
  related_claims[]
  status
  response?
}
```

A subject may respond to or dispute a review, but must not be able to silently rewrite the reviewer's attestation.

## Derived model

Derived state stays above the immutable claim layer:

```text
claims + external evidence + peer reviews
                  |
                  v
            derived signals
                  |
                  v
           capability graph
```

OneBlock should expose the evidence graph and let different contexts interpret it differently.

## Migration rule

Do not replace existing Profile, Block, ActivityRecord, Factor, or Personal Chain storage in-place.

Migration should be additive and projection-first. Existing Profile fields and Integration ActivityRecords remain their systems of record and are exposed through provenance-aware claim projections instead of being copied.

1. introduce shared provenance types;
2. project current self-authored Profile data as `self_declared`;
3. project Integration ActivityRecord data as `external` and keep provider/app attribution mandatory;
4. introduce structured PeerReview storage/API;
5. build DerivedSignal projections from claims/reviews;
6. render profile views grouped/filterable by provenance;
7. migrate legacy views only after the new path is proven.

This avoids stable-memory migrations while the model is still evolving.

## Current Phase-2 API

The backend now adds native storage for new self-declared claims and structured peer reviews:

- `createSelfClaim`
- `getProfileClaim`
- `listProfileClaims`
- `createPeerReview`
- `getPeerReview`
- `listPeerReviews`
- `respondToPeerReview`
- `disputePeerReview`
- `withdrawPeerReview`

`listProfileClaims` also projects legacy Profile name/bio/links and Integration ActivityRecords into the same claim view. This makes existing data immediately provenance-aware without a stable-memory rewrite or duplicate external records.
