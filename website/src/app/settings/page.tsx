'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { db } from '../../lib/firebase';
import { saveBrandingSetup } from '../../lib/onboarding';
import { getPlanDefinition } from '../../lib/plans';
import { ChurchSubscription, getChurchSubscription } from '../../lib/subscription';

type GeneralSettings = {
  timezone: string;
  locale: string;
};

const defaultBranding = {
  churchDisplayName: '',
  shortName: '',
  logoUrl: '',
  primaryColor: '#4F46E5',
  secondaryColor: '#3730A3',
  accentColor: '#10B981',
  welcomeTitle: '',
  welcomeSubtitle: '',
};

const defaultGeneral: GeneralSettings = {
  timezone: 'Asia/Calcutta',
  locale: 'en',
};

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { activeChurchId, activeChurch, activeMembership, branding, multiTenantEnabled } = useChurch();
  const router = useRouter();
  const [brandingForm, setBrandingForm] = useState(defaultBranding);
  const [generalForm, setGeneralForm] = useState(defaultGeneral);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [subscription, setSubscription] = useState<ChurchSubscription | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    setBrandingForm({
      churchDisplayName: branding?.churchDisplayName || activeChurch?.name || '',
      shortName: branding?.shortName || activeChurch?.name || '',
      logoUrl: branding?.logoUrl || '',
      primaryColor: branding?.primaryColor || '#4F46E5',
      secondaryColor: branding?.secondaryColor || '#3730A3',
      accentColor: branding?.accentColor || '#10B981',
      welcomeTitle: branding?.welcomeTitle || `Welcome to ${branding?.churchDisplayName || activeChurch?.name || 'your church'}`,
      welcomeSubtitle: branding?.welcomeSubtitle || 'A sacred space for ministry to grow, serve, and connect together in faith.',
    });
  }, [activeChurch?.name, branding]);

  useEffect(() => {
    if (!activeChurchId) return;

    getDoc(doc(db, `churches/${activeChurchId}/settings`, 'general')).then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Partial<GeneralSettings>;
      setGeneralForm({
        timezone: data.timezone || defaultGeneral.timezone,
        locale: data.locale || defaultGeneral.locale,
      });
    });

    getChurchSubscription(activeChurchId).then(setSubscription).catch(() => setSubscription(null));
  }, [activeChurchId]);

  if (loading || !user) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const canManageSettings = activeMembership?.role === 'church_admin';
  const activePlan = getPlanDefinition(subscription?.planId);

  const handleSave = async () => {
    if (!activeChurchId) return;
    setSaving(true);
    setStatus('');
    try {
      await saveBrandingSetup(activeChurchId, brandingForm);
      await setDoc(doc(db, `churches/${activeChurchId}/settings`, 'general'), {
        ...generalForm,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setStatus('Settings saved successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="studio-page">
          <section className="studio-head">
            <div className="studio-head-copy">
              <div className="studio-kicker">Workspace settings</div>
              <h1 className="studio-title">Settings</h1>
              <p className="studio-copy">Customize your church workspace and manage how PrayLoom appears for your team.</p>
            </div>
            {canManageSettings && <button className="studio-action" type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>}
          </section>

          {multiTenantEnabled && !activeMembership ? (
            <div className="studio-panel studio-empty">No church membership linked yet. Ask your church admin to add your UID before opening settings.</div>
          ) : !canManageSettings ? (
            <div className="studio-panel studio-empty">Only church admins can manage workspace settings.</div>
          ) : (
            <>
              <section className="studio-setting-grid">
                <div>
                  <div className="studio-section-title">Subscription</div>
                  <div className="studio-section-copy">See your current PrayLoom plan, operational limits, and activation status.</div>
                </div>
                <div className="studio-panel studio-form-card">
                  <div className="studio-subscription-header">
                    <div>
                      <div className="studio-subscription-plan">{subscription?.planName || activePlan.name}</div>
                      <div className="studio-section-copy">{activePlan.subtitle}</div>
                    </div>
                    <span className={`studio-plan-pill is-${activePlan.accent}`}>
                      {(subscription?.status || 'trial').replace('_', ' ')}
                    </span>
                  </div>

                  <div className="studio-plan-limit-grid">
                    <div className="studio-plan-limit-card">
                      <div className="studio-plan-limit-label">Centers</div>
                      <div className="studio-plan-limit-value">{subscription?.limits.centers ?? 'Unlimited'}</div>
                    </div>
                    <div className="studio-plan-limit-card">
                      <div className="studio-plan-limit-label">Members</div>
                      <div className="studio-plan-limit-value">{subscription?.limits.members ?? 'Unlimited'}</div>
                    </div>
                    <div className="studio-plan-limit-card">
                      <div className="studio-plan-limit-label">Students</div>
                      <div className="studio-plan-limit-value">{subscription?.limits.students ?? 'Unlimited'}</div>
                    </div>
                  </div>

                  <div className="studio-plan-note">
                    Billing is currently handled in a simple trial/manual activation mode while PrayLoom subscription management is being expanded.
                  </div>
                </div>
              </section>

              <section className="studio-setting-grid">
                <div>
                  <div className="studio-section-title">Church Profile</div>
                  <div className="studio-section-copy">Foundational identification for your workspace across the network.</div>
                </div>
                <div className="studio-panel studio-form-card">
                  <div className="studio-field-grid">
                    <div className="studio-field">
                      <label className="studio-label">Display Name</label>
                      <input className="studio-input" value={brandingForm.churchDisplayName} onChange={(e) => setBrandingForm((current) => ({ ...current, churchDisplayName: e.target.value }))} />
                    </div>
                    <div className="studio-field">
                      <label className="studio-label">Short Name</label>
                      <input className="studio-input" value={brandingForm.shortName} onChange={(e) => setBrandingForm((current) => ({ ...current, shortName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="studio-field-grid">
                    <div className="studio-field">
                      <label className="studio-label">Workspace Slug</label>
                      <input className="studio-input" value={activeChurchId || ''} disabled />
                    </div>
                    <div className="studio-field">
                      <label className="studio-label">Logo URL</label>
                      <input className="studio-input" value={brandingForm.logoUrl} onChange={(e) => setBrandingForm((current) => ({ ...current, logoUrl: e.target.value }))} placeholder="Upload or paste your logo URL" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="studio-setting-grid">
                <div>
                  <div className="studio-section-title">Branding</div>
                  <div className="studio-section-copy">Visual identity settings to make the portal feel like your church home.</div>
                </div>
                <div className="studio-panel studio-form-card">
                  <div className="studio-swatch-row">
                    <div className="studio-swatch" style={{ background: brandingForm.primaryColor }}>Primary</div>
                    <div className="studio-swatch" style={{ background: brandingForm.secondaryColor }}>Secondary</div>
                    <div className="studio-swatch" style={{ background: brandingForm.accentColor }}>Accent</div>
                  </div>
                  <div className="studio-field-grid">
                    <div className="studio-field">
                      <label className="studio-label">Primary Color</label>
                      <input className="studio-input" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm((current) => ({ ...current, primaryColor: e.target.value }))} />
                    </div>
                    <div className="studio-field">
                      <label className="studio-label">Secondary Color</label>
                      <input className="studio-input" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm((current) => ({ ...current, secondaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="studio-field">
                    <label className="studio-label">Accent Color</label>
                    <input className="studio-input" value={brandingForm.accentColor} onChange={(e) => setBrandingForm((current) => ({ ...current, accentColor: e.target.value }))} />
                  </div>
                  <div className="studio-field">
                    <label className="studio-label">Welcome Title</label>
                    <input className="studio-input" value={brandingForm.welcomeTitle} onChange={(e) => setBrandingForm((current) => ({ ...current, welcomeTitle: e.target.value }))} />
                  </div>
                  <div className="studio-field">
                    <label className="studio-label">Welcome Subtitle</label>
                    <textarea className="studio-textarea" value={brandingForm.welcomeSubtitle} onChange={(e) => setBrandingForm((current) => ({ ...current, welcomeSubtitle: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="studio-setting-grid">
                <div>
                  <div className="studio-section-title">Preferences</div>
                  <div className="studio-section-copy">Workflow and system settings for a smooth administrative experience.</div>
                </div>
                <div className="studio-panel studio-form-card">
                  <div className="studio-field-grid">
                    <div className="studio-field">
                      <label className="studio-label">Language</label>
                      <select className="studio-select" value={generalForm.locale} onChange={(e) => setGeneralForm((current) => ({ ...current, locale: e.target.value }))}>
                        <option value="en">English (US)</option>
                        <option value="en-IN">English (India)</option>
                      </select>
                    </div>
                    <div className="studio-field">
                      <label className="studio-label">Timezone</label>
                      <select className="studio-select" value={generalForm.timezone} onChange={(e) => setGeneralForm((current) => ({ ...current, timezone: e.target.value }))}>
                        <option value="Asia/Calcutta">(GMT+05:30) India Standard Time</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">(GMT-05:00) Eastern Time</option>
                      </select>
                    </div>
                  </div>
                  {status ? <div className="studio-secondary">{status}</div> : null}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="studio-action is-soft" type="button" onClick={() => router.refresh()}>Discard Changes</button>
                    <button className="studio-action" type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
