'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createChurchWorkspace, normalizeChurchSlug } from '../../lib/onboarding';

function ProgressSidebar() {
  return (
    <aside className="onboard-sidebar">
      <div className="onboard-sidebar-content">
        <Link href="/" className="onboard-brand">
          PrayLoom
        </Link>

        <div className="onboard-progress-block">
          <div className="onboard-progress-label">Progress</div>
          <div className="onboard-progress-bar">
            <span style={{ width: '25%' }} />
          </div>
          <div className="onboard-progress-copy">Step 1 of 4: Workspace Basics</div>

          <div className="onboard-checklist">
            <div className="onboard-check-item active">
              <div className="onboard-check-icon">1</div>
              <span>Workspace Basics</span>
            </div>
            <div className="onboard-check-item">
              <div className="onboard-check-icon">2</div>
              <span>Identity &amp; Branding</span>
            </div>
            <div className="onboard-check-item">
              <div className="onboard-check-icon">3</div>
              <span>Center Setup</span>
            </div>
            <div className="onboard-check-item">
              <div className="onboard-check-icon">4</div>
              <span>Team Invitation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="onboard-sidebar-footer">
        <div className="onboard-sidebar-quote">
          &ldquo;A church workspace should feel as thoughtful as the ministry it serves.&rdquo;
        </div>
      </div>
    </aside>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const defaultTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);
  const [fullName, setFullName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [country, setCountry] = useState('India');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/signup');
      return;
    }

    setFullName(user.displayName || '');
    setContactEmail(user.email || '');
  }, [loading, router, user]);

  const handleChurchNameChange = (value: string) => {
    setChurchName(value);
    setSlug((current) => (current ? current : normalizeChurchSlug(value)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSubmitting(true);
    try {
      await createChurchWorkspace(user, {
        fullName,
        churchName,
        slug,
        contactEmail,
        contactPhone,
        timezone,
        country,
      });
      router.push(`/onboarding/branding?church=${encodeURIComponent(normalizeChurchSlug(slug || churchName))}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create church workspace. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-layout">
        <ProgressSidebar />

        <main className="onboard-main">
          <div className="onboard-wrap">
            <div className="onboard-step">Step 1 of 4</div>
            <h1 className="onboard-title">Create your church workspace.</h1>
            <p className="onboard-copy">
              This becomes the main branded workspace for your church on PrayLoom.
            </p>

            <div className="onboard-panel">
              <form onSubmit={handleSubmit}>
                <div className="onboard-grid-2">
                  <div className="onboard-field full">
                    <label className="onboard-label">Church Name</label>
                    <input
                      className="onboard-input"
                      value={churchName}
                      onChange={(e) => handleChurchNameChange(e.target.value)}
                      placeholder="Grace Cathedral"
                      required
                    />
                  </div>

                  <div className="onboard-field full">
                    <label className="onboard-label">Church ID / Slug</label>
                    <input
                      className="onboard-input"
                      value={slug}
                      onChange={(e) => setSlug(normalizeChurchSlug(e.target.value))}
                      placeholder="grace-cathedral"
                      required
                    />
                    <div className="onboard-hint">This unique identifier will be used in your workspace URL.</div>
                  </div>

                  <div className="onboard-field">
                    <label className="onboard-label">Your Name</label>
                    <input
                      className="onboard-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="onboard-field">
                    <label className="onboard-label">Contact Email</label>
                    <input
                      type="email"
                      className="onboard-input"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="admin@gracecathedral.org"
                      required
                    />
                  </div>

                  <div className="onboard-field">
                    <label className="onboard-label">Contact Phone</label>
                    <input
                      className="onboard-input"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="onboard-field">
                    <label className="onboard-label">Country</label>
                    <input
                      className="onboard-input"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                    />
                  </div>

                  <div className="onboard-field full">
                    <label className="onboard-label">Timezone</label>
                    <input
                      className="onboard-input"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Asia/Kolkata"
                      required
                    />
                  </div>
                </div>

                {error ? (
                  <div style={{ background: '#ffdad6', color: '#93000a', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginTop: '18px' }}>
                    {error}
                  </div>
                ) : null}

                <div className="onboard-actions">
                  <button type="button" className="onboard-ghost-btn">
                    Back
                  </button>
                  <button type="submit" className="onboard-primary-btn" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Church Workspace'}
                  </button>
                </div>
              </form>
            </div>

            <div className="onboard-helper-row">
              <div className="onboard-helper-card">
                <div className="onboard-helper-title">Secure Foundation</div>
                <div className="onboard-helper-copy">Your workspace is created with structured access and protected settings from the start.</div>
              </div>
              <div className="onboard-helper-card">
                <div className="onboard-helper-title">Bespoke Branding</div>
                <div className="onboard-helper-copy">The next step lets you shape the church identity, color palette, and welcome voice.</div>
              </div>
              <div className="onboard-helper-card">
                <div className="onboard-helper-title">Global Reach</div>
                <div className="onboard-helper-copy">Centers, members, students, and attendance all grow from this workspace foundation.</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
