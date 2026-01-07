import React, { useEffect, useState } from 'react';
import { useGlobalContext, useOneblock } from '../Store';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import { Block, Visibility, NewBlock } from '../../types/block';
import BlockChain from '../BlockChain';
import '../../styles/Block.css';

export const BlocksPanel: React.FC = () => {
  const oneblock = useOneblock();
  const { state: { principal } } = useGlobalContext();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [profileId, setProfileId] = useState<string>('');

  const [newBlock, setNewBlock] = useState<{
    start_time: string;
    end_time: string;
    narrative: string;
    evidence_refs: string;
    visibility: Visibility;
  }>({
    start_time: '',
    end_time: '',
    narrative: '',
    evidence_refs: '',
    visibility: Visibility.Public,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profile] = await oneblock.getMyProfile();
      if (profile) {
        setProfileId(profile.id);
        loadBlocks(profile.id);
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
      const startTime = new Date(newBlock.start_time).getTime() * 1000000; // Convert to nanoseconds
      const endTime = newBlock.end_time 
        ? new Date(newBlock.end_time).getTime() * 1000000 
        : null;

      const evidenceRefs = newBlock.evidence_refs
        .split('\n')
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0);

      const blockData: NewBlock = {
        profile_id: profileId,
        start_time: startTime,
        end_time: endTime || undefined,
        narrative: newBlock.narrative,
        evidence_refs: evidenceRefs,
        visibility: newBlock.visibility,
      };

      const result = await oneblock.createBlock(blockData);
      
      if ('ok' in result) {
        toast.success('Block created successfully!');
        setNewBlock({
          start_time: '',
          end_time: '',
          narrative: '',
          evidence_refs: '',
          visibility: Visibility.Public,
        });
        loadBlocks(profileId);
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
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Life Blocks</h2>
        <p className="panel-subtitle">Create verifiable blocks of your life events</p>
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
          <small>One reference per line. Use protocol://path format for verifiable sources</small>
        </div>

        <div className="form-group">
          <label>Visibility</label>
          <select
            value={newBlock.visibility}
            onChange={(e) => setNewBlock({ ...newBlock, visibility: e.target.value as Visibility })}
          >
            <option value={Visibility.Public}>Public</option>
            <option value={Visibility.Unlisted}>Unlisted</option>
            <option value={Visibility.Private}>Private</option>
          </select>
        </div>

        <button type="submit" disabled={creating}>
          {creating ? <CircularProgress size={20} /> : 'Create Block'}
        </button>
      </form>

      <div className="blocks-section">
        <h3>Your Blocks ({blocks.length})</h3>
        <BlockChain blocks={blocks} showPrivacy={true} />
      </div>
    </div>
  );
};
