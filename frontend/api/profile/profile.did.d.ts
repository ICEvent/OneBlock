import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : Favorite } |
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
  'createProfile' : ActorMethod<[NewProfile], Result>,
  'deleteLink' : ActorMethod<[string, string], Result>,
  'getInbox' : ActorMethod<[string], [] | [Inbox]>,
  'getMyFavorites' : ActorMethod<[], Array<Favorite>>,
  'getMyInbox' : ActorMethod<[], [] | [Inbox]>,
  'getMyProfile' : ActorMethod<[], [] | [Profile]>,
  'getProfile' : ActorMethod<[string], [] | [Profile]>,
  'getProfileByPrincipal' : ActorMethod<[string], [] | [Profile]>,
  'updateProfile' : ActorMethod<[string, UpdateProfile], Result>,
}
