export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Favorite = IDL.Record({
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'address' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : Favorite, 'err' : IDL.Text });
  const Link = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Network = IDL.Variant({
    'ic' : IDL.Null,
    'ethereum' : IDL.Null,
    'bitcoin' : IDL.Null,
  });
  const Wallet = IDL.Record({
    'name' : IDL.Text,
    'addresses' : IDL.Vec(
      IDL.Record({ 'network' : Network, 'address' : IDL.Text })
    ),
  });
  const NewProfile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  const Inbox = IDL.Record({ 'owner' : IDL.Principal, 'inboxid' : IDL.Text });
  const Profile = IDL.Record({
    'id' : IDL.Text,
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'createtime' : IDL.Int,
    'links' : IDL.Vec(Link),
  });
  const UpdateProfile = IDL.Record({
    'bio' : IDL.Text,
    'pfp' : IDL.Text,
    'name' : IDL.Text,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Text], [Result], []),
    'addFavorite' : IDL.Func(
        [IDL.Record({ 'name' : IDL.Text, 'address' : IDL.Text })],
        [Result_1],
        [],
      ),
    'addInbox' : IDL.Func([IDL.Text], [Result], []),
    'addLink' : IDL.Func([IDL.Text, Link], [Result], []),
    'addWallet' : IDL.Func([IDL.Text, Wallet], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'createProfile' : IDL.Func([NewProfile], [Result], []),
    'deleteLink' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'getInbox' : IDL.Func([IDL.Text], [IDL.Opt(Inbox)], ['query']),
    'getMyFavorites' : IDL.Func([], [IDL.Vec(Favorite)], ['query']),
    'getMyInbox' : IDL.Func([], [IDL.Opt(Inbox)], ['query']),
    'getMyProfile' : IDL.Func([], [IDL.Opt(Profile)], ['query']),
    'getProfile' : IDL.Func([IDL.Text], [IDL.Opt(Profile)], ['query']),
    'getProfileByPrincipal' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Profile)],
        ['query'],
      ),
    'updateProfile' : IDL.Func([IDL.Text, UpdateProfile], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
