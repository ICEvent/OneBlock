// Block system types for oneblock
export type BlockId = string;
export type ProfileId = string;
export type TraitId = string;
export type Timestamp = bigint;

export type Visibility =
  { 'global': null } |
  { 'unlisted': null } |
  { 'personal': null };

export enum VerificationLevel {
  Self = 'self',
  Platform = 'platform',
  Verifiable = 'verifiable',
  ThirdParty = 'third_party'
}

export enum Strength {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

export interface Block {
  id: BlockId;
  profile_id: ProfileId;
  
  start_time: Timestamp;
  end_time: [] | [Timestamp];
  
  evidence_refs: string[]; // e.g. alltrack://route/123
  derived_traits: TraitId[];
  
  narrative: [] | [string];
  
  visibility: Visibility;
  
  hash: string; // content hash for audit
  created_at: Timestamp;
}

export interface Trait {
  id: TraitId;
  label: string;
  
  strength: Strength;
  confidence: number; // 0.0 to 1.0
  
  explanation: string;
  derived_from: BlockId[];
  
  visibility: Visibility;
  updated_at: Timestamp;
}

export interface NewBlock {
  profile_id: ProfileId;
  start_time: Timestamp;
  end_time?: Timestamp;
  evidence_refs: string[];
  narrative?: string;
  visibility: Visibility;
}

export interface NewTrait {
  label: string;
  strength: Strength;
  confidence: number;
  explanation: string;
  derived_from: BlockId[];
  visibility: Visibility;
}
