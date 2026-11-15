import type { _SERVICE, IntegrationApp, IntegrationConnection } from '../api/profile/service.did.d';

export function parseConnectionInput(externalId: string, scopes: string) {
  const externalUserId = externalId.trim();
  if (!externalUserId) throw new Error('Enter your account ID on this application.');
  const values = [...new Set(scopes.split(',').map(s => s.trim()).filter(Boolean))];
  if (!values.length) throw new Error('Enter at least one activity scope.');
  return { externalUserId, scopes: values };
}

export function unwrapResult<T>(result: { ok: T } | { err: string }): T {
  if ('err' in result) throw new Error(result.err);
  return result.ok;
}

// Resolve exact connections: older registries may have incomplete list indexes.
export async function loadConnections(api: Pick<_SERVICE, 'getConnection'>, profileId: string, apps: IntegrationApp[]) {
  const entries = await Promise.all(apps.map(async app => {
    const [connection] = await api.getConnection(profileId, app.id);
    return [app.id, connection] as const;
  }));
  return Object.fromEntries(entries) as Record<string, IntegrationConnection | undefined>;
}

export function integrationDate(timestamp: bigint) {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

export function safeReceiptUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch { return undefined; }
}
