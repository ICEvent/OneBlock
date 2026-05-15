import { profile } from "../profile";

export const getScores = (principal: string) => profile.getScores(principal);

export const recomputeScores = (principal: string, policyId?: string) =>
  profile.recomputeScores(principal, policyId ? [policyId] : []);

export const evaluatePolicy = (principal: string, policyId: string) =>
  profile.evaluatePolicy(principal, policyId);

export const createIdentityGraph = (principal: string) =>
  profile.createIdentityGraph({ principal, entity_kind: { human: null } });
