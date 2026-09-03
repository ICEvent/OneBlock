//@ts-nocheck
import React, { useEffect, useState } from "react";
import { Link as NavLink, useParams } from "react-router-dom";
import { Profile } from "../api/profile/service.did.d";
import type { Block } from "../types/block";
import { useGlobalContext, useOneblock } from "../components/Store";
import Navbar from "../components/Navbar";
import ProfileLayout from "../layouts/ProfileLayout";
import ProfileSidebar from "../components/ProfileSidebar";
import ScoresOIP from "../components/ScoresOIP";
import TrustReputation from "../components/TrustReputation";
import "../styles/Profile.css";
import "../styles/PageShell.css";

function blockDate(timestamp: bigint) {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      .format(new Date(Number(timestamp / 1_000_000n)));
  } catch {
    return '';
  }
}

const ProfilePage = () => {
  const oneblock = useOneblock();
  const { state: { agent, isAuthed, principal } } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<any | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<Block | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setProfile(null);
      setScores(null);
      setLatestUpdate(null);

      try {
        if (!id) return;
        const [profileData] = await oneblock.getProfile(id);
        if (!active || !profileData) return;

        const nextProfile = {
          id: profileData.id,
          name: profileData.name,
          bio: profileData.bio,
          pfp: profileData.pfp,
          links: profileData.links,
          owner: profileData.owner,
        } as Profile;
        setProfile(nextProfile);

        const ownerText = profileData.owner && typeof profileData.owner === 'object' && profileData.owner.toText
          ? profileData.owner.toText()
          : profileData.owner ? String(profileData.owner) : '';

        const [scoreResult, blockResult] = await Promise.all([
          ownerText ? oneblock.getScores(ownerText).catch(() => []) : Promise.resolve([]),
          oneblock.listBlocks(profileData.id).catch(() => []),
        ]);
        if (!active) return;

        const [scoreData] = scoreResult;
        if (scoreData) setScores(scoreData);

        const newestPublicNarrative = [...blockResult]
          .filter((block: Block) => 'global' in block.visibility && Boolean(block.narrative?.[0]?.trim()))
          .sort((a: Block, b: Block) => a.created_at === b.created_at ? 0 : a.created_at > b.created_at ? -1 : 1)[0] ?? null;
        setLatestUpdate(newestPublicNarrative);
      } catch (error) {
        console.error('Error loading profile', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [id, oneblock]);

  const ProfilePlaceholder = () => (
    <div className="profile-loading ecosystem-panel" aria-busy="true">
      <div className="profile-avatar"><div className="placeholder-avatar animate-pulse" /></div>
      <div className="profile-info">
        <div className="placeholder-text animate-pulse" />
        <div className="placeholder-bio animate-pulse" />
      </div>
    </div>
  );

  const ProfileNotFound = () => (
    <div className="profile-not-found ecosystem-panel">
      <span className="material-icons" aria-hidden="true">person_off</span>
      <h2>Profile not found</h2>
      <p>This profile does not exist or is no longer available.</p>
      <NavLink to="/">Return home</NavLink>
    </div>
  );

  const ownerText = profile?.owner && typeof profile.owner === 'object' && profile.owner.toText
    ? profile.owner.toText()
    : profile?.owner ? String(profile.owner) : '';
  const isOwnProfile = Boolean(isAuthed && principal && ownerText && principal.toText() === ownerText);

  return (
    <>
      <Navbar />
      <div className="page-with-navbar profile-page-shell">
        {loading ? (
          <ProfilePlaceholder />
        ) : !profile ? (
          <ProfileNotFound />
        ) : (
          <ProfileLayout
            sidebar={<ProfileSidebar profile={profile} tags={[]} />}
            main={
              <div className="profile-main-stack">
                <section className="profile-context-banner ecosystem-hero">
                  <div>
                    <span className="section-eyebrow">Sovereign identity</span>
                    <h2>Evidence before score</h2>
                    <p>
                      This profile separates verified interaction history from probabilistic identity signals, so reputation stays portable and contextual.
                    </p>
                  </div>
                  <div className="profile-context-badge">OneBlock public record</div>
                </section>

                {latestUpdate ? (
                  <section className="profile-latest-update ecosystem-panel">
                    <div className="profile-latest-update-header">
                      <div>
                        <span className="section-eyebrow">Latest public update</span>
                        <div className="profile-update-meta">
                          <span className="material-icons" aria-hidden="true">public</span>
                          <span>{blockDate(latestUpdate.created_at)}</span>
                        </div>
                      </div>
                      <NavLink to={`/${profile.id}`}>View public chain →</NavLink>
                    </div>
                    <p className="profile-latest-update-text">{latestUpdate.narrative[0]}</p>
                    {latestUpdate.evidence_refs.length > 0 && (
                      <div className="profile-update-evidence">
                        <span className="material-icons" aria-hidden="true">verified</span>
                        {latestUpdate.evidence_refs.length} evidence reference{latestUpdate.evidence_refs.length === 1 ? '' : 's'} attached
                      </div>
                    )}
                  </section>
                ) : isOwnProfile ? (
                  <section className="profile-latest-update-empty ecosystem-panel">
                    <div>
                      <span className="section-eyebrow">Latest public update</span>
                      <h3>Your public record is ready.</h3>
                      <p>Share a short update from your workspace. It will be stored as a normal public block, not as a separate post record.</p>
                    </div>
                    <NavLink to="/console">Share an update →</NavLink>
                  </section>
                ) : null}

                {profile.owner && (
                  <TrustReputation
                    subject={profile.owner}
                    agent={agent}
                    showPrivateStats={isOwnProfile}
                  />
                )}

                <section className="profile-model-card ecosystem-panel">
                  <div className="profile-section-heading">
                    <span className="section-eyebrow">Derived identity model</span>
                    <h3>Identity confidence</h3>
                    <p>
                      OIP signals are probabilistic interpretations built above the evidence layer. They are not the same as verified Trust Protocol reputation.
                    </p>
                  </div>
                  <ScoresOIP scores={scores} />
                </section>
              </div>
            }
          />
        )}
      </div>
    </>
  );
};

export { ProfilePage };
