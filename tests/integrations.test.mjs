import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConnections, parseConnectionInput, safeReceiptUrl, unwrapResult, integrationDate } from '../src/oneblock_frontend/src/lib/integrations.ts';

test('connection input requires explicit account and scopes, trims and deduplicates', () => {
  assert.throws(() => parseConnectionInput('  ', 'donation.made'), /account ID/);
  assert.throws(() => parseConnectionInput('alice', ' , '), /scope/);
  assert.deepEqual(parseConnectionInput(' alice ', 'donation.made, , donation.made, service.completed '), {
    externalUserId: 'alice', scopes: ['donation.made', 'service.completed'],
  });
});

test('backend errors cannot be treated as successful authorization', () => {
  assert.equal(unwrapResult({ ok: 1n }), 1n);
  assert.throws(() => unwrapResult({ err: 'profile not found' }), /profile not found/);
});

test('connections use exact reads including revoked and missing entries', async () => {
  const calls = [];
  const revoked = { status: { revoked: null }, app_id: 'a' };
  const connections = await loadConnections({ getConnection: async (profile, app) => {
    calls.push([profile, app]);
    return app === 'a' ? [revoked] : [];
  } }, 'profile-1', [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(calls, [['profile-1', 'a'], ['profile-1', 'b']]);
  assert.equal(connections.a, revoked);
  assert.equal(connections.b, undefined);
});

test('connection read failures fail closed instead of showing disconnected', async () => {
  await assert.rejects(loadConnections({ getConnection: async () => { throw new Error('offline'); } }, 'p', [{ id: 'a' }]), /offline/);
});

test('untrusted receipt links allow only absolute web URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '/relative', 'file:///etc/passwd', 'bad', undefined]) {
    assert.equal(safeReceiptUrl(url), undefined);
  }
  assert.equal(safeReceiptUrl('https://example.com/receipt'), 'https://example.com/receipt');
});

test('timestamps support nanoseconds and invalid ranges', () => {
  assert.equal(integrationDate(10n ** 30n), 'Unknown');
  assert.notEqual(integrationDate(0n), 'Unknown');
});
