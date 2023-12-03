export const idlFactory = ({ IDL }) => {
  const Result_2 = IDL.Variant({ 'ok' : IDL.Int, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Subject = IDL.Text;
  const Content = IDL.Text;
  const Sender = IDL.Text;
  const Message = IDL.Record({
    'id' : IDL.Nat,
    'content' : Content,
    'subject' : Subject,
    'sender' : Sender,
    'timestamp' : IDL.Int,
    'carrier' : IDL.Principal,
  });
  const Currency = IDL.Variant({
    'BTC' : IDL.Null,
    'ETH' : IDL.Null,
    'ICP' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Nat64, 'err' : IDL.Text });
  const Inbox = IDL.Service({
    'addMember' : IDL.Func([IDL.Principal], [Result_2], []),
    'allow' : IDL.Func([IDL.Principal], [Result_2], []),
    'block' : IDL.Func([IDL.Text], [Result_2], []),
    'changeName' : IDL.Func([IDL.Text], [Result_1], []),
    'changeOwner' : IDL.Func([IDL.Principal], [Result_2], []),
    'changeVersion' : IDL.Func([IDL.Text], [Result_1], []),
    'drop' : IDL.Func([Subject, Content, Sender], [Result_2], []),
    'fetch' : IDL.Func([], [IDL.Vec(Message)], ['query']),
    'name' : IDL.Func([], [IDL.Text], ['query']),
    'ping' : IDL.Func(
        [],
        [IDL.Record({ 'name' : IDL.Text, 'version' : IDL.Text })],
        ['query'],
      ),
    'read' : IDL.Func([IDL.Nat], [Result_2], []),
    'search' : IDL.Func(
        [IDL.Int, IDL.Int, IDL.Opt(IDL.Text)],
        [IDL.Vec(Message)],
        ['query'],
      ),
    'setOpenToCarrier' : IDL.Func([IDL.Bool], [Result_1], []),
    'transfer' : IDL.Func(
        [Currency, IDL.Opt(IDL.Nat), IDL.Nat64, IDL.Principal],
        [Result],
        [],
      ),
  });
  return Inbox;
};
export const init = ({ IDL }) => { return [IDL.Text]; };
