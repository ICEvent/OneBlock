import { Actor, type ActorSubclass, type HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

const RAM_CANISTER_ID = 'pxu6k-jaaaa-aaaap-aaamq-cai';

type CandidOptional<T> = [] | [T];

type ReviewDimensionCandid = {
  key: string;
  score: number;
};

type ReviewCandid = {
  id: bigint;
  interactionId: bigint;
  reviewer: Principal;
  subject: Principal;
  schemaId: string;
  dimensions: ReviewDimensionCandid[];
  comment: CandidOptional<string>;
  createdAt: bigint;
};

type ReviewViewCandid = {
  review: ReviewCandid;
  revealed: boolean;
};

type ActorStatsCandid = {
  totalInteractions: bigint;
  completedInteractions: bigint;
  uniqueCounterparties: bigint;
  evidenceCount: bigint;
  attestationCount: bigint;
  verifiedReviewCount: bigint;
};

export type VerifiedReview = {
  id: bigint;
  interactionId: bigint;
  reviewer: Principal;
  subject: Principal;
  schemaId: string;
  dimensions: Array<{ key: string; score: number }>;
  comment?: string;
  createdAt: bigint;
};

export type VerifiedReviewView = {
  review: VerifiedReview;
  revealed: boolean;
};

export type ActorTrustStats = {
  totalInteractions: bigint;
  completedInteractions: bigint;
  uniqueCounterparties: bigint;
  evidenceCount: bigint;
  attestationCount: bigint;
  verifiedReviewCount: bigint;
};

type TrustActor = {
  getVerifiedReviews: (subject: Principal) => Promise<ReviewViewCandid[]>;
  getActorTrustStats: (subject: Principal) => Promise<CandidOptional<ActorStatsCandid>>;
};

const trustIdlFactory = ({ IDL }: { IDL: any }) => {
  const ReviewDimension = IDL.Record({ key: IDL.Text, score: IDL.Nat8 });
  const Review = IDL.Record({
    id: IDL.Nat,
    interactionId: IDL.Nat,
    reviewer: IDL.Principal,
    subject: IDL.Principal,
    schemaId: IDL.Text,
    dimensions: IDL.Vec(ReviewDimension),
    comment: IDL.Opt(IDL.Text),
    createdAt: IDL.Int,
  });
  const ReviewView = IDL.Record({ review: Review, revealed: IDL.Bool });
  const ActorStats = IDL.Record({
    totalInteractions: IDL.Nat,
    completedInteractions: IDL.Nat,
    uniqueCounterparties: IDL.Nat,
    evidenceCount: IDL.Nat,
    attestationCount: IDL.Nat,
    verifiedReviewCount: IDL.Nat,
  });

  return IDL.Service({
    getVerifiedReviews: IDL.Func([IDL.Principal], [IDL.Vec(ReviewView)], ['query']),
    getActorTrustStats: IDL.Func([IDL.Principal], [IDL.Opt(ActorStats)], ['query']),
  });
};

function fromOptional<T>(value: CandidOptional<T>): T | undefined {
  return value.length ? value[0] : undefined;
}

function toPrincipal(subject: Principal | string): Principal {
  return typeof subject === 'string' ? Principal.fromText(subject) : subject;
}

function fromReview(review: ReviewCandid): VerifiedReview {
  return {
    id: review.id,
    interactionId: review.interactionId,
    reviewer: review.reviewer,
    subject: review.subject,
    schemaId: review.schemaId,
    dimensions: review.dimensions.map(({ key, score }) => ({ key, score })),
    comment: fromOptional(review.comment),
    createdAt: review.createdAt,
  };
}

export class TrustService {
  private readonly actor: ActorSubclass<TrustActor>;

  constructor(agent: HttpAgent) {
    this.actor = Actor.createActor<TrustActor>(trustIdlFactory as any, {
      agent,
      canisterId: RAM_CANISTER_ID,
    });
  }

  async getVerifiedReviews(subject: Principal | string): Promise<VerifiedReviewView[]> {
    const views = await this.actor.getVerifiedReviews(toPrincipal(subject));
    return views.map((view) => ({ review: fromReview(view.review), revealed: view.revealed }));
  }

  async getActorTrustStats(subject: Principal | string): Promise<ActorTrustStats | undefined> {
    return fromOptional(await this.actor.getActorTrustStats(toPrincipal(subject)));
  }
}
