import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityRecord, ActivityType, IntegrationApp, IntegrationConnection, Profile, _SERVICE } from '../api/profile/service.did.d';
import Navbar from '../components/Navbar';
import { useGlobalContext } from '../components/Store';
import { integrationDate, loadConnections, parseConnectionInput, safeReceiptUrl, unwrapResult } from '../lib/integrations';
import '../styles/Console.css';
import '../styles/Integrations.css';

const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);

function Application({ app, connection, api, onChange }: {
  app: IntegrationApp; connection?: IntegrationConnection; api: _SERVICE; onChange: () => void;
}) {
  const [externalId, setExternalId] = useState(connection?.external_user_id ?? '');
  const [scopes, setScopes] = useState(connection?.scopes.join(', ') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const active = connection && 'active' in connection.status;

  const change = async (revoke: boolean) => {
    setBusy(true); setError('');
    try {
      if (revoke) unwrapResult(await api.revokeConnection(app.id));
      else {
        const input = parseConnectionInput(externalId, scopes);
        unwrapResult(await api.connectApp(app.id, input.externalUserId, input.scopes));
      }
      onChange();
    } catch (error) { setError(errorText(error)); }
    finally { setBusy(false); }
  };

  return <article className="integration-card">
    <header><h2>{app.name || app.id}</h2><span className="integration-badge">{!app.active ? 'Application inactive' : active ? 'Connected' : connection ? Object.keys(connection.status)[0] : 'Not connected'}</span></header>
    <p>{app.description}</p>
    <dl><dt>Application ID</dt><dd>{app.id}</dd><dt>Category</dt><dd>{Object.keys(app.category)[0]}</dd>
      <dt>Submitting principal</dt><dd>{app.owner.toText()}</dd>
      <dt>Import policy</dt><dd>{Object.keys(app.verification_policy)[0]}</dd></dl>
    {active && <p>Connected {integrationDate(connection.created_at)}. Account: {connection.external_user_id}. Scopes: {connection.scopes.join(', ') || 'None recorded'}.</p>}
    {connection?.revoked_at[0] !== undefined && <p>Revoked {integrationDate(connection.revoked_at[0])}.</p>}
    <form onSubmit={event => { event.preventDefault(); void change(false); }}>
      <label>Account ID on {app.name}<input required value={externalId} disabled={busy} onChange={e => setExternalId(e.target.value)} /></label>
      <label>Activity scopes (comma separated)<input required value={scopes} disabled={busy} onChange={e => setScopes(e.target.value)} placeholder="e.g. donation.made" /></label>
      <p className="integration-note">This authorizes the registered submitting principal to send records to your profile. Account ownership is not verified by OAuth. Scopes are recorded preferences; the current backend does not enforce scope restrictions.</p>
      <div className="integration-actions"><button disabled={busy || !app.active}>{busy ? 'Saving…' : active ? 'Update authorization' : 'Connect application'}</button>
        {active && <button type="button" disabled={busy} onClick={() => setConfirmRevoke(true)}>Revoke access</button>}</div>
    </form>
    {confirmRevoke && <div className="integration-confirm" role="group" aria-label="Confirm revocation"><p>Stop future submissions from {app.name}? Existing records are retained.</p><button disabled={busy} onClick={() => void change(true)}>Confirm revocation</button> <button disabled={busy} onClick={() => setConfirmRevoke(false)}>Cancel</button></div>}
    {error && <p role="alert">{error}</p>}
  </article>;
}

function RecordDetails({ record }: { record: ActivityRecord }) {
  const receipt = safeReceiptUrl(record.attestation[0]?.receipt_url[0]);
  return <details className="integration-record"><summary>{record.activity_type} · {integrationDate(record.event_timestamp)}{record.amount[0] !== undefined ? ` · ${record.amount[0]} ${record.currency[0] ?? ''}` : ''}</summary>
    <p>Imported from {record.app_id}. This record has not been independently verified by this page.</p>
    <dl><dt>Record ID</dt><dd>{record.id}</dd><dt>Visibility</dt><dd>{Object.keys(record.visibility)[0]}</dd><dt>Imported</dt><dd>{integrationDate(record.ingest_timestamp)}</dd><dt>Schema version</dt><dd>{record.schema_version.toString()}</dd><dt>Reported verification level</dt><dd>{Object.keys(record.verification_level)[0]}</dd><dt>Reported signature status</dt><dd>{record.attestation[0] ? Object.keys(record.attestation[0].signature_status)[0] : 'Not provided'}</dd><dt>Source event key</dt><dd>{record.idempotency_key}</dd></dl>
    {record.payload.length > 0 && <dl>{record.payload.map((entry, index) => <React.Fragment key={index}><dt>{entry.key}</dt><dd>{entry.value}</dd></React.Fragment>)}</dl>}
    {receipt && <a href={receipt} target="_blank" rel="noopener noreferrer">Open source receipt</a>}
    <p><Link to="/verify">Verify a certified proof</Link></p>
  </details>;
}

function Records({ api, profile, apps }: { api: _SERVICE; profile: Profile; apps: IntegrationApp[] }) {
  const [appId, setAppId] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setTypes([]);
    if (appId) void api.listActivityTypes(appId).then(value => { if (current) setTypes(value); }).catch(error => { if (current) setError(errorText(error)); });
    return () => { current = false; };
  }, [api, appId]);
  useEffect(() => {
    let current = true;
    setLoading(true); setRecords([]); setError('');
    void api.getActivityRecords(profile.id, appId ? [appId] : [], typeKey ? [typeKey] : []).then(value => {
      if (current) setRecords([...value].sort((a, b) => a.event_timestamp > b.event_timestamp ? -1 : a.event_timestamp < b.event_timestamp ? 1 : 0));
    }).catch(error => { if (current) setError(errorText(error)); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [api, profile.id, appId, typeKey]);
  return <section className="integration-card" aria-label="Imported records"><h2>Imported activity</h2>
    <div className="integration-filters"><label>Application<select value={appId} onChange={e => { setAppId(e.target.value); setTypeKey(''); }}><option value="">All applications</option>{apps.map(app => <option key={app.id} value={app.id}>{app.name || app.id}</option>)}</select></label>
      <label>Activity type<select disabled={!appId} value={typeKey} onChange={e => setTypeKey(e.target.value)}><option value="">All activity types</option>{types.map(type => <option key={type.type_key} value={type.type_key}>{type.type_label || type.type_key}</option>)}</select></label></div>
    {error && <p role="alert">{error}</p>}{loading ? <p role="status">Loading records…</p> : records.length ? <><p>{records.length} records</p>{records.map(record => <RecordDetails key={record.id} record={record} />)}</> : !error && <p>No imported activity matches these filters.</p>}
  </section>;
}

export function Workspace({ api }: { api: _SERVICE }) {
  const [data, setData] = useState<{ profile?: Profile; apps: IntegrationApp[]; connections: Record<string, IntegrationConnection | undefined> }>();
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setData(undefined); setError('');
    void (async () => {
      const [[profile], apps] = await Promise.all([api.getMyProfile(), api.listApps()]);
      const connections = profile ? await loadConnections(api, profile.id, apps) : {};
      if (current) setData({ profile, apps, connections });
    })().catch(error => { if (current) setError(errorText(error)); });
    return () => { current = false; };
  }, [api, revision]);
  return <><button onClick={() => setRevision(value => value + 1)}>Refresh integrations</button>
    {error ? <p role="alert">Could not load integrations: {error}</p> : !data ? <p role="status">Loading integrations…</p> : !data.profile ? <p>Create your <Link to="/console">OneBlock profile</Link> before connecting applications.</p> : <>
      <p>Profile: {data.profile.name || data.profile.id}</p>
      {!data.apps.length && <section className="integration-card"><h2>No registered applications</h2><p>Applications appear here after a OneBlock administrator registers them.</p></section>}
      <div className="integration-grid">{data.apps.map(app => <Application key={`${app.id}:${revision}`} app={app} connection={data.connections[app.id]} api={api} onChange={() => setRevision(value => value + 1)} />)}</div>
      <Records key={revision} api={api} profile={data.profile} apps={data.apps} />
    </>}
  </>;
}

export default function Integrations() {
  const { state: { oneblock, isAuthed, principal } } = useGlobalContext();
  return <div className="console-page"><Navbar /><main className="console-shell integrations-page">
    <header className="console-hero ecosystem-hero"><div className="console-hero-copy"><span className="section-eyebrow">OneBlock data sources</span><h1>Third-party integrations</h1><p>Authorize applications, inspect imported activity, and manage access to your profile.</p></div></header>
    <aside className="integration-card"><strong>Imported data and certified proofs</strong><p>Connecting an application does not verify its claims. Imported activity and reported signature statuses require independent verification. Use <Link to="/verify">Verify</Link> for certified proof checks.</p></aside>
    {isAuthed && principal ? <Workspace key={principal.toText()} api={oneblock} /> : <p>Log in to manage your integrations.</p>}
  </main></div>;
}
