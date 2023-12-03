import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Content = string;
export type Currency = { 'BTC' : null } |
  { 'ETH' : null } |
  { 'ICP' : null };
export interface Inbox {
  'addMember' : ActorMethod<[Principal], Result_2>,
  'allow' : ActorMethod<[Principal], Result_2>,
  'block' : ActorMethod<[string], Result_2>,
  'changeName' : ActorMethod<[string], Result_1>,
  'changeOwner' : ActorMethod<[Principal], Result_2>,
  'changeVersion' : ActorMethod<[string], Result_1>,
  'drop' : ActorMethod<[Subject, Content, Sender], Result_2>,
  'fetch' : ActorMethod<[], Array<Message>>,
  'name' : ActorMethod<[], string>,
  'ping' : ActorMethod<[], { 'name' : string, 'version' : string }>,
  'read' : ActorMethod<[bigint], Result_2>,
  'search' : ActorMethod<[bigint, bigint, [] | [string]], Array<Message>>,
  'setOpenToCarrier' : ActorMethod<[boolean], Result_1>,
  'transfer' : ActorMethod<
    [Currency, [] | [bigint], bigint, Principal],
    Result
  >,
}
export interface Message {
  'id' : bigint,
  'content' : Content,
  'subject' : Subject,
  'sender' : Sender,
  'timestamp' : bigint,
  'carrier' : Principal,
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Sender = string;
export type Subject = string;
export interface _SERVICE extends Inbox {}
