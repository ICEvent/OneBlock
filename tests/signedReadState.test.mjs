import assert from 'node:assert/strict';
import test from 'node:test';
import { Cbor, HttpAgent, requestIdOf } from '@dfinity/agent';
import { ECDSAKeyIdentity, DelegationChain, DelegationIdentity } from '@dfinity/identity';

// Exercise the real agent's CBOR wire envelope with a P-256 delegated session,
// including the pre-signed request reused by polling. No live replica required.
test('delegated P-256 read_state sends the signed envelope unchanged, including retries', async () => {
  const issuer = await ECDSAKeyIdentity.generate();
  const session = await ECDSAKeyIdentity.generate();
  const chain = await DelegationChain.create(issuer, session.getPublicKey(), new Date(Date.now() + 60_000));
  const identity = DelegationIdentity.fromDelegation(session, chain);
  let requests = 0;
  let rejectOnce = true;
  let expectedContent;
  const agent = new HttpAgent({
    identity,
    host: 'https://ic0.app',
    retryTimes: 1,
    backoffStrategy: () => ({ next: () => 0 }),
    fetch: async (url, options) => {
      assert.match(String(url), /\/read_state$/);
      requests++;
      const envelope = Cbor.decode(options.body);
      assert.deepEqual(Object.keys(envelope).sort(), ['content', 'sender_delegation', 'sender_pubkey', 'sender_sig']);
      assert.deepEqual(envelope.content, expectedContent);
      assert.deepEqual(new Uint8Array(envelope.sender_pubkey), new Uint8Array(issuer.getPublicKey().toDer()));
      // The v2 CBOR decoder represents large integers as BigNumber objects.
      const content = { ...envelope.content, ingress_expiry: BigInt(envelope.content.ingress_expiry.toString()) };
      const challenge = new Uint8Array([
        ...new TextEncoder().encode('\x0Aic-request'),
        ...new Uint8Array(await requestIdOf(content)),
      ]);
      assert.equal(await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' }, session.getKeyPair().publicKey,
        envelope.sender_sig, challenge,
      ), true, 'request content must match its P-256 signature');
      if (rejectOnce) { rejectOnce = false; throw new Error('temporary transport failure'); }
      return new Response(Cbor.encode({}), { status: 200 });
    },
  });
  const fields = { paths: [[new TextEncoder().encode('time')]] };
  const request = await agent.createReadStateRequest(fields);
  expectedContent = Cbor.decode(Cbor.encode(request.body)).content;
  await agent.readState('aaaaa-aa', fields, undefined, request);
  await agent.readState('aaaaa-aa', fields, undefined, request);
  assert.equal(requests, 3, 'initial attempt, retry, and subsequent polling request');
});
