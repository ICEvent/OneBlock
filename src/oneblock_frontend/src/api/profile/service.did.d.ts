import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

// Block system types
export type BlockId = string;
export type TraitId = string;
export type Timestamp = bigint;

export type Visibility = { 'public' : null } |
  { 'unlisted' : null } |
  { 'private' : null };

export type Strength = { 'low' : null } |
  { 'medium' : null } |
  { 'high' : null };

export interface Block {
  'id' : BlockId,
  'profile_id' : string,
  'start_time' : Timestamp,
  'end_time' : [] | [Timestamp],
  'evidence_refs' : Array<string>,
  'derived_traits' : Array<TraitId>,
  'narrative' : [] | [string],
  'visibility' : Visibility,
  'hash' : string,
  'created_at' : Timestamp,
}

export interface Trait {
  'id' : TraitId,
  'label' : string,
  'strength' : Strength,
  'confidence' : number,
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'visibility' : Visibility,
  'updated_at' : Timestamp,
}

export interface NewBlock {
  'profile_id' : string,
  'start_time' : Timestamp,
  'end_time' : [] | [Timestamp],
  'evidence_refs' : Array<string>,
  'narrative' : [] | [string],
  'visibility' : Visibility,
}

export interface NewTrait {
  'label' : string,
  'strength' : Strength,
  'confidence' : number,
  'explanation' : string,
  'derived_from' : Array<BlockId>,
  'visibility' : Visibility,
}

export interface Canister {
  'desc' : string,
  'name' : string,
  'posts' : string,
  'canisterid' : Principal,
  'gallery' : string,
}
export interface Favorite {
  'owner' : Principal,
  'name' : string,
  'address' : string,
}
export interface Inbox { 'owner' : Principal, 'inboxid' : string }
export interface Link { 'url' : string, 'name' : string }
export type Network = { 'ic' : null } |
  { 'ethereum' : null } |
  { 'bitcoin' : null };
export interface NewProfile {
  'id' : string,
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export interface Profile {
  'id' : string,
  'bio' : string,
  'pfp' : string,
  'owner' : Principal,
  'name' : string,
  'createtime' : bigint,
  'links' : Array<Link>,
  'blocks' : Array<BlockId>,
  'traits' : Array<TraitId>,
  'visibility' : Visibility,
  'last_updated' : Timestamp,
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : Favorite } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export interface UpdateProfile {
  'bio' : string,
  'pfp' : string,
  'name' : string,
}
export interface Wallet {
  'name' : string,
  'addresses' : Array<{ 'network' : Network, 'address' : string }>,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[string], Result>,
  'addFavorite' : ActorMethod<
    [{ 'name' : string, 'address' : string }],
    Result_1
  >,
  'addInbox' : ActorMethod<[string], Result>,
  'addLink' : ActorMethod<[string, Link], Result>,
  'addWallet' : ActorMethod<[string, Wallet], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'changeId' : ActorMethod<[string, string], Result>,
  'createBlock' : ActorMethod<[NewBlock], Result_2>,
  'createProfile' : ActorMethod<[NewProfile], Result>,
  'createTrait' : ActorMethod<[string, NewTrait], Result_2>,
  'deleteLink' : ActorMethod<[string, string], Result>,
  'editCanister' : ActorMethod<[Canister], Result>,
  'getBlock' : ActorMethod<[BlockId], [] | [Block]>,
  'getChain' : ActorMethod<[string], Array<Block>>,
  'getDefaultProfiles' : ActorMethod<[bigint], Array<Profile>>,
  'getInbox' : ActorMethod<[string], [] | [Inbox]>,
  'getMyCanister' : ActorMethod<[], [] | [Canister]>,
  'getMyFavorites' : ActorMethod<[], Array<Favorite>>,
  'getMyInbox' : ActorMethod<[], [] | [Inbox]>,
  'getMyProfile' : ActorMethod<[], [] | [Profile]>,
  'getProfile' : ActorMethod<[string], [] | [Profile]>,
  'getProfileByPrincipal' : ActorMethod<[string], [] | [Profile]>,
  'getProfileCanister' : ActorMethod<[Principal], [] | [Canister]>,
  'getProfileCount' : ActorMethod<[], bigint>,
  'getProfiles' : ActorMethod<[bigint, bigint], Array<Profile>>,
  'getTrait' : ActorMethod<[TraitId], [] | [Trait]>,
  'getTraits' : ActorMethod<[string], Array<Trait>>,
  'listBlocks' : ActorMethod<[string], Array<Block>>,
  'reserveid' : ActorMethod<[string], Result>,
  'searchProfilesByName' : ActorMethod<[string], Array<Profile>>,
  'updateProfile' : ActorMethod<[string, UpdateProfile], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
