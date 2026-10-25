import React from "react";
import type { PeerReview, ProfileClaim } from "../api/profile/service.did.d";
import "../styles/ProfileProvenance.css";

type Props = {
  claims: ProfileClaim[];
  reviews: PeerReview[];
};

function variantName(value: Record<string, unknown> | undefined): string {
  if (!value) return "";
  return Object.keys(value)[0] ?? "";
}

function claimValue(value: ProfileClaim["value"]): string {
  if ("text" in value) return value.text;
  if ("reference" in value) return value.reference;
  if ("boolean" in value) return value.boolean ? "Yes" : "No";
  if ("number" in value) return String(value.number);
  return "";
}

function relationshipName(value: PeerReview["relationship"]): string {
  if ("other" in value) return value.other;
  return variantName(value).replaceAll("_", " ");
}

function displayPredicate(predicate: string): string {
  const last = predicate.split(".").pop() || predicate;
  return last.replaceAll("_", " ");
}

function shortIssuer(issuer: string): string {
  if (issuer.length <= 24) return issuer;
  return `${issuer.slice(0, 12)}…${issuer.slice(-7)}`;
}

function ClaimItem({ claim }: { claim: ProfileClaim }) {
  const capability = claim.capability[0];
  const verification = variantName(claim.provenance.verification);
  const context = claim.context[0];

  return (
    <article className="provenance-item">
      <div className="provenance-item-heading">
        <div>
          <span className="provenance-item-label">{displayPredicate(claim.predicate)}</span>
          {capability && (
            <span className="provenance-capability">
              {capability.display_label[0] || capability.path}
            </span>
          )}
        </div>
        {verification && verification !== "none" && (
          <span className="provenance-verification">
            {verification.replaceAll("_", " ")}
          </span>
        )}
      </div>

      <div className="provenance-value">{claimValue(claim.value)}</div>

      <div className="provenance-meta">
        <span>Source: {shortIssuer(claim.provenance.issuer_id)}</span>
        {context && <span>Context: {context}</span>}
        {claim.provenance.evidence.length > 0 && (
          <span>{claim.provenance.evidence.length} evidence reference{claim.provenance.evidence.length === 1 ? "" : "s"}</span>
        )}
      </div>
    </article>
  );
}

function ReviewItem({ review }: { review: PeerReview }) {
  const capability = review.capability[0];
  const narrative = review.narrative[0];
  const response = review.response[0];
  const status = variantName(review.status);

  return (
    <article className="provenance-item review-item">
      <div className="provenance-item-heading">
        <div>
          <span className="provenance-item-label">{relationshipName(review.relationship)}</span>
          {capability && (
            <span className="provenance-capability">
              {capability.display_label[0] || capability.path}
            </span>
          )}
        </div>
        {status !== "active" && (
          <span className="provenance-status">{status}</span>
        )}
      </div>

      <p className="review-context">{review.context}</p>
      {narrative && <p className="review-narrative">{narrative}</p>}

      {review.assessment_tags.length > 0 && (
        <div className="review-tags">
          {review.assessment_tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className="provenance-meta">
        <span>Reviewer: {shortIssuer(review.reviewer.toText())}</span>
        {review.evidence.length > 0 && (
          <span>{review.evidence.length} evidence reference{review.evidence.length === 1 ? "" : "s"}</span>
        )}
        {review.related_claims.length > 0 && (
          <span>{review.related_claims.length} related claim{review.related_claims.length === 1 ? "" : "s"}</span>
        )}
      </div>

      {response && (
        <div className="review-response">
          <strong>Response</strong>
          <span>{response}</span>
        </div>
      )}
    </article>
  );
}

function EmptySource({ children }: { children: React.ReactNode }) {
  return <div className="provenance-empty">{children}</div>;
}

const ProfileProvenance: React.FC<Props> = ({ claims, reviews }) => {
  const selfClaims = claims.filter(
    (claim) => variantName(claim.provenance.source_kind) === "self_declared"
  );
  const externalClaims = claims.filter(
    (claim) => variantName(claim.provenance.source_kind) === "external"
  );

  return (
    <section className="profile-provenance">
      <div className="profile-provenance-intro ecosystem-panel">
        <div>
          <span className="section-eyebrow">Profile provenance</span>
          <h3>Three sources, kept distinct</h3>
          <p>
            OneBlock shows what a person says about themselves, what outside sources can attest,
            and what people who interacted with them say in context.
          </p>
        </div>
        <div className="profile-provenance-rule">
          <span>Who says it</span>
          <span>What supports it</span>
          <span>How it was verified</span>
        </div>
      </div>

      <div className="provenance-grid">
        <section className="provenance-section ecosystem-panel">
          <header>
            <span className="provenance-source-icon material-icons" aria-hidden="true">person</span>
            <div>
              <span className="section-eyebrow">Self-declared</span>
              <h3>About</h3>
              <p>Information authored or maintained by this profile owner.</p>
            </div>
          </header>
          <div className="provenance-list">
            {selfClaims.length > 0 ? (
              selfClaims.map((claim) => <ClaimItem key={claim.id} claim={claim} />)
            ) : (
              <EmptySource>No self-declared information yet.</EmptySource>
            )}
          </div>
        </section>

        <section className="provenance-section ecosystem-panel">
          <header>
            <span className="provenance-source-icon material-icons" aria-hidden="true">verified</span>
            <div>
              <span className="section-eyebrow">Third-party sources</span>
              <h3>Evidence</h3>
              <p>Claims projected from connected apps, institutions, or verifiable records.</p>
            </div>
          </header>
          <div className="provenance-list">
            {externalClaims.length > 0 ? (
              externalClaims.map((claim) => <ClaimItem key={claim.id} claim={claim} />)
            ) : (
              <EmptySource>No external evidence has been connected yet.</EmptySource>
            )}
          </div>
        </section>

        <section className="provenance-section ecosystem-panel">
          <header>
            <span className="provenance-source-icon material-icons" aria-hidden="true">forum</span>
            <div>
              <span className="section-eyebrow">OneBlock peers</span>
              <h3>Reviews</h3>
              <p>Contextual attestations from other identities, not a global star rating.</p>
            </div>
          </header>
          <div className="provenance-list">
            {reviews.length > 0 ? (
              reviews.map((review) => <ReviewItem key={review.id} review={review} />)
            ) : (
              <EmptySource>No peer reviews yet.</EmptySource>
            )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default ProfileProvenance;
