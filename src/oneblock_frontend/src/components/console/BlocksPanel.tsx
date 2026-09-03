import React, { useEffect, useState } from 'react';
import { useOneblock } from '../Store';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import { Block } from '../../types/block';
import type { NewBlock, Visibility } from '../../api/profile/service.did.d';
import BlockChain from '../BlockChain';
import '../../styles/Block.css';

export const BlocksPanel: React.FC = () => {
  const oneblock = useOneblock();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [profileId, setProfileId] = useState<string>('');
  const [quickUpdate, setQuickUpdate] = useState('');

  const [newBlock, setNewBlock] = useState<{
    start_time: string;
    end_time: string;
    narrative: string;
    evidence_refs: string;
    visibilityKey: 'global' | 'unlisted' | 'personal';
  }>({
    start_time: '',
    end_time: '',
    narrative: '',
    evidence_refs: '',
    visibilityKey: 'global',
  });

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profile] = await oneblock.getMyProfile();
      if (profile) {
        setProfileId(profile.id);
        await loadBlocks(profile.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async (pid: string) => {
    try {
      const blockList = await oneblock.listBlocks(pid);
      setBlocks(blockList);
    } catch (error) {
      console.error('Error loading blocks:', error);
    }
  };

  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const narrative = quickUpdate.trim();

    if (!profileId) {
      toast.error('Profile not found');
      return;
    }
    if (!narrative) {
      toast.error('Write an update first');
      return;
    }

    setSharing(true);
    try {
      const now = BigInt(Date.now()) * 1_000_000n;
      const blockData: NewBlock = {
        profile_id: profileId,
        start_time: now,
        end_time: [],
        narrative: [narrative],
        evidence_refs: [],
        visibility: { global: null },
      };
      const result = await oneblock.createBlock(blockData);
      if ('ok' in result) {
        setQuickUpdate('');
        toast.success('Public update shared');
        await loadBlocks(profileId);
      } else {
        toast.error(`Failed to share update: ${result.err}`);
      }
    } catch (error) {
      console.error('Error sharing update:', error);
      toast.error('Failed to share update');
    } finally {
      setSharing(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId) {
      toast.error('Profile not found');
      return;
    }

    if (!newBlock.start_time || !newBlock.narrative) {
      toast.error('Please fill in required fields');
      return;
    }

    setCreating(true);
    try {
      const startTime = BigInt(new Date(newBlock.start_time).getTime()) * 1_000_000n;
      const endTime = newBlock.end_time
        ? BigInt(new Date(newBlock.end_time).getTime()) * 1_000_000n
        : null;

      const evidenceRefs = newBlock.evidence_refs
        .split('\n')
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0);

      const blockData: NewBlock = {
        profile_id: profileId,
        start_time: startTime,
        end_time: endTime ? [endTime] : [],
        narrative: newBlock.narrative ? [newBlock.narrative] : [],
        evidence_refs: evidenceRefs,
        visibility: { [newBlock.visibilityKey]: null } as Visibility,
      };

      const result = await oneblock.createBlock(blockData);

      if ('ok' in result) {
        toast.success('Block created successfully!');
        setNewBlock({
          start_time: '',
          end_time: '',
          narrative: '',
          evidence_refs: '',
          visibilityKey: 'global',
        });
        await loadBlocks(profileId);
      } else {
        toast.error(`Failed to create block: ${result.err}`);
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Failed to create block');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="block-loading-state">
          <CircularProgress size={26} />
          <span>Loading your record…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="section-eyebrow">Personal record</span>
        <h2>Life Blocks</h2>
        <p className="panel-subtitle">Publish a quick update or create a detailed block with evidence and explicit visibility.</p>
      </div>

      <section className="quick-update-card" aria-labelledby="quick-update-title">
        <div className="quick-update-heading">
          <div>
            <span className="section-eyebrow">Share update</span>
            <h3 id="quick-update-title">What changed?</h3>
            <p>A quick update is a normal public OneBlock block — no separate post database and no duplicated state.</p>
          </div>
          <span className="quick-update-visibility"><span className="material-icons" aria-hidden="true">public</span> Public</span>
        </div>
        <form onSubmit={handleQuickUpdate} className="quick-update-form">
          <textarea
            value={quickUpdate}
            onChange={(e) => setQuickUpdate(e.target.value)}
            placeholder="Share a milestone, thought, contribution, or recent activity…"
            rows={3}
            maxLength={500}
            aria-label="Public update"
          />
          <div className="quick-update-actions">
            <span>{quickUpdate.length}/500 · Appears on your public profile</span>
            <button type="submit" disabled={sharing || !quickUpdate.trim()}>
              {sharing ? <CircularProgress size={18} /> : 'Share update'}
            </button>
          </div>
        </form>
      </section>

      <div className="block-form-heading">
        <div>
          <span className="section-eyebrow">Detailed record</span>
          <h3>Create a block</h3>
        </div>
        <p>Use this for dated events, evidence references, unlisted records, or private notes.</p>
      </div>

      <form onSubmit={handleCreateBlock} className="block-form">
        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            value={newBlock.start_time}
            onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date (optional)</label>
          <input
            type="date"
            value={newBlock.end_time}
            onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
          />
          <small>Leave empty if ongoing</small>
        </div>

        <div className="form-group">
          <label>Narrative *</label>
          <textarea
            value={newBlock.narrative}
            onChange={(e) => setNewBlock({ ...newBlock, narrative: e.target.value })}
            placeholder="Describe what happened during this time..."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label>Evidence References</label>
          <textarea
            value={newBlock.evidence_refs}
            onChange={(e) => setNewBlock({ ...newBlock, evidence_refs: e.target.value })}
            placeholder="alltrack://route/123&#10;icevent://event/456&#10;https://example.com/proof"
            rows={3}
          />
          <small>One reference per line. Use protocol://path format for verifiable sources.</small>
        </div>

        <div className="form-group">
          <label>Visibility</label>
          <select
            value={newBlock.visibilityKey}
            onChange={(e) => setNewBlock({ ...newBlock, visibilityKey: e.target.value as 'global' | 'unlisted' | 'personal' })}
          >
            <option value="global">Public — listed on your profile and chain</option>
            <option value="unlisted">Unlisted — hidden from public views, owner-only for now</option>
            <option value="personal">Private — only you can read it</option>
          </select>
          <small>Share-by-link for unlisted blocks will require unguessable capability links; sequential block IDs are not treated as private links.</small>
        </div>

        <button type="submit" disabled={creating}>
          {creating ? <CircularProgress size={20} /> : 'Create block'}
        </button>
      </form>

      <div className="blocks-section">
        <div className="blocks-section-heading">
          <div>
            <span className="section-eyebrow">Your record</span>
            <h3>Blocks</h3>
          </div>
          <span>{blocks.length} total visible to you</span>
        </div>
        <BlockChain blocks={blocks} showPrivacy={true} />
      </div>
    </div>
  );
};
