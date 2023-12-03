import type { Principal } from '@dfinity/principal';
export type AccountIdentifier = string;
export type AccountIdentifier__1 = string;
export interface AllowanceRequest {
  'token' : TokenIdentifier,
  'owner' : User,
  'spender' : Principal,
}
export interface ApproveRequest {
  'token' : TokenIdentifier,
  'subaccount' : [] | [SubAccount],
  'allowance' : Balance,
  'spender' : Principal,
}
export type Balance = bigint;
export interface BalanceRequest { 'token' : TokenIdentifier, 'user' : User }
export type BalanceResponse = { 'ok' : Balance } |
  { 'err' : CommonError__1 };
export type Balance__1 = bigint;
export type CommonError = { 'InvalidToken' : TokenIdentifier } |
  { 'Other' : string };
export type CommonError__1 = { 'InvalidToken' : TokenIdentifier } |
  { 'Other' : string };
export type EVENTID = bigint;
export interface EventCollection {
  'eid' : EVENTID,
  'status' : { 'new' : null } |
    { 'close' : null } |
    { 'ready' : null },
  'title' : string,
  'asset' : string,
  'host' : string,
  'claimcode' : string,
  'location' : string,
  'datetime' : bigint,
}
export type Extension = string;
export interface Inventory { 'token' : TokenIndex, 'event' : EventCollection }
export type Memo = Array<number>;
export type Metadata = {
    'fungible' : {
      'decimals' : number,
      'metadata' : [] | [Array<number>],
      'name' : string,
      'symbol' : string,
    }
  } |
  { 'nonfungible' : { 'metadata' : [] | [Array<number>] } };
export interface MintRequest { 'to' : User, 'metadata' : [] | [Array<number>] }
export type Result = { 'ok' : Balance__1 } |
  { 'err' : CommonError };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Metadata } |
  { 'err' : CommonError };
export type Result_3 = { 'ok' : TokenIndex } |
  { 'err' : string };
export type Result_4 = { 'ok' : AccountIdentifier__1 } |
  { 'err' : CommonError };
export type SubAccount = Array<number>;
export type TokenIdentifier = string;
export type TokenIdentifier__1 = string;
export type TokenIndex = number;
export interface TransferRequest {
  'to' : User,
  'token' : TokenIdentifier,
  'notify' : boolean,
  'from' : User,
  'memo' : Memo,
  'subaccount' : [] | [SubAccount],
  'amount' : Balance,
}
export type TransferResponse = { 'ok' : Balance } |
  {
    'err' : { 'CannotNotify' : AccountIdentifier } |
      { 'InsufficientBalance' : null } |
      { 'InvalidToken' : TokenIdentifier } |
      { 'Rejected' : null } |
      { 'Unauthorized' : AccountIdentifier } |
      { 'Other' : string }
  };
export type User = { 'principal' : Principal } |
  { 'address' : AccountIdentifier };
export interface attendance_nft {
  'acceptCycles' : () => Promise<undefined>,
  'addMinter' : (arg_0: Principal) => Promise<undefined>,
  'allowance' : (arg_0: AllowanceRequest) => Promise<Result>,
  'approve' : (arg_0: ApproveRequest) => Promise<undefined>,
  'availableCycles' : () => Promise<bigint>,
  'balance' : (arg_0: BalanceRequest) => Promise<BalanceResponse>,
  'bearer' : (arg_0: TokenIdentifier__1) => Promise<Result_4>,
  'checkANFT' : (arg_0: bigint) => Promise<[] | [EventCollection]>,
  'claimANFT' : (arg_0: EVENTID, arg_1: string) => Promise<Result_3>,
  'closeClaim' : (arg_0: EVENTID) => Promise<Result_1>,
  'extensions' : () => Promise<Array<Extension>>,
  'getAllowances' : () => Promise<Array<[TokenIndex, Principal]>>,
  'getMinter' : () => Promise<Principal>,
  'getRegistry' : () => Promise<Array<[TokenIndex, AccountIdentifier__1]>>,
  'getTokens' : () => Promise<Array<[TokenIndex, Metadata]>>,
  'inventory' : () => Promise<Array<Inventory>>,
  'metadata' : (arg_0: TokenIdentifier__1) => Promise<Result_2>,
  'mintANFT' : (arg_0: EventCollection) => Promise<Result_1>,
  'mintNFT' : (arg_0: MintRequest) => Promise<TokenIndex>,
  'openClaim' : (arg_0: EVENTID) => Promise<Result_1>,
  'setMinter' : (arg_0: Principal) => Promise<undefined>,
  'supply' : (arg_0: TokenIdentifier__1) => Promise<Result>,
  'transfer' : (arg_0: TransferRequest) => Promise<TransferResponse>,
}
export interface _SERVICE extends attendance_nft {}
