export const idlFactory = ({ IDL }) => {
  const TokenIdentifier = IDL.Text;
  const AccountIdentifier = IDL.Text;
  const User = IDL.Variant({
    'principal' : IDL.Principal,
    'address' : AccountIdentifier,
  });
  const AllowanceRequest = IDL.Record({
    'token' : TokenIdentifier,
    'owner' : User,
    'spender' : IDL.Principal,
  });
  const Balance__1 = IDL.Nat;
  const CommonError = IDL.Variant({
    'InvalidToken' : TokenIdentifier,
    'Other' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : Balance__1, 'err' : CommonError });
  const SubAccount = IDL.Vec(IDL.Nat8);
  const Balance = IDL.Nat;
  const ApproveRequest = IDL.Record({
    'token' : TokenIdentifier,
    'subaccount' : IDL.Opt(SubAccount),
    'allowance' : Balance,
    'spender' : IDL.Principal,
  });
  const BalanceRequest = IDL.Record({
    'token' : TokenIdentifier,
    'user' : User,
  });
  const CommonError__1 = IDL.Variant({
    'InvalidToken' : TokenIdentifier,
    'Other' : IDL.Text,
  });
  const BalanceResponse = IDL.Variant({
    'ok' : Balance,
    'err' : CommonError__1,
  });
  const TokenIdentifier__1 = IDL.Text;
  const AccountIdentifier__1 = IDL.Text;
  const Result_4 = IDL.Variant({
    'ok' : AccountIdentifier__1,
    'err' : CommonError,
  });
  const EVENTID = IDL.Nat;
  const EventCollection = IDL.Record({
    'eid' : EVENTID,
    'status' : IDL.Variant({
      'new' : IDL.Null,
      'close' : IDL.Null,
      'ready' : IDL.Null,
    }),
    'title' : IDL.Text,
    'asset' : IDL.Text,
    'host' : IDL.Text,
    'claimcode' : IDL.Text,
    'location' : IDL.Text,
    'datetime' : IDL.Int,
  });
  const TokenIndex = IDL.Nat32;
  const Result_3 = IDL.Variant({ 'ok' : TokenIndex, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Extension = IDL.Text;
  const Metadata = IDL.Variant({
    'fungible' : IDL.Record({
      'decimals' : IDL.Nat8,
      'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)),
      'name' : IDL.Text,
      'symbol' : IDL.Text,
    }),
    'nonfungible' : IDL.Record({ 'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)) }),
  });
  const Inventory = IDL.Record({
    'token' : TokenIndex,
    'event' : EventCollection,
  });
  const Result_2 = IDL.Variant({ 'ok' : Metadata, 'err' : CommonError });
  const MintRequest = IDL.Record({
    'to' : User,
    'metadata' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Memo = IDL.Vec(IDL.Nat8);
  const TransferRequest = IDL.Record({
    'to' : User,
    'token' : TokenIdentifier,
    'notify' : IDL.Bool,
    'from' : User,
    'memo' : Memo,
    'subaccount' : IDL.Opt(SubAccount),
    'amount' : Balance,
  });
  const TransferResponse = IDL.Variant({
    'ok' : Balance,
    'err' : IDL.Variant({
      'CannotNotify' : AccountIdentifier,
      'InsufficientBalance' : IDL.Null,
      'InvalidToken' : TokenIdentifier,
      'Rejected' : IDL.Null,
      'Unauthorized' : AccountIdentifier,
      'Other' : IDL.Text,
    }),
  });
  const attendance_nft = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addMinter' : IDL.Func([IDL.Principal], [], []),
    'allowance' : IDL.Func([AllowanceRequest], [Result], ['query']),
    'approve' : IDL.Func([ApproveRequest], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'balance' : IDL.Func([BalanceRequest], [BalanceResponse], ['query']),
    'bearer' : IDL.Func([TokenIdentifier__1], [Result_4], ['query']),
    'checkANFT' : IDL.Func([IDL.Nat], [IDL.Opt(EventCollection)], []),
    'claimANFT' : IDL.Func([EVENTID, IDL.Text], [Result_3], []),
    'closeClaim' : IDL.Func([EVENTID], [Result_1], []),
    'extensions' : IDL.Func([], [IDL.Vec(Extension)], ['query']),
    'getAllowances' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, IDL.Principal))],
        ['query'],
      ),
    'getMinter' : IDL.Func([], [IDL.Principal], ['query']),
    'getRegistry' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, AccountIdentifier__1))],
        ['query'],
      ),
    'getTokens' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TokenIndex, Metadata))],
        ['query'],
      ),
    'inventory' : IDL.Func([], [IDL.Vec(Inventory)], ['query']),
    'metadata' : IDL.Func([TokenIdentifier__1], [Result_2], ['query']),
    'mintANFT' : IDL.Func([EventCollection], [Result_1], []),
    'mintNFT' : IDL.Func([MintRequest], [TokenIndex], []),
    'openClaim' : IDL.Func([EVENTID], [Result_1], []),
    'setMinter' : IDL.Func([IDL.Principal], [], []),
    'supply' : IDL.Func([TokenIdentifier__1], [Result], ['query']),
    'transfer' : IDL.Func([TransferRequest], [TransferResponse], []),
  });
  return attendance_nft;
};
export const init = ({ IDL }) => { return []; };
