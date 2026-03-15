'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addOnboardingCenter, setOnboardingState } from '../../../lib/onboarding';

const emptyForm = {
    name: '',
    code: '',
    hostName: '',
    hostPhone: '',
    areaName: '',
    address: '',
};

type CenterDraft = typeof emptyForm & { id: string };

function CentersOnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const churchId = searchParams.get('church') || '';
    const [form, setForm] = useState(emptyForm);
    const [centers, setCenters] = useState<CenterDraft[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const addDraftCenter = () => {
        if (!form.name.trim() || !form.code.trim()) {
            setError('Center name and code are required.');
            return;
        }

        setCenters((current) => [
            ...current,
            { ...form, id: crypto.randomUUID() },
        ]);
        setForm(emptyForm);
        setError('');
    };

    const removeDraftCenter = (id: string) => {
        setCenters((current) => current.filter((center) => center.id !== id));
    };

    const finishSetup = async (skip = false) => {
        if (!churchId) {
            setError('Missing church workspace reference. Please restart onboarding.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            if (!skip) {
                for (const center of centers) {
                    await addOnboardingCenter(churchId, center);
                }
            }

            await setOnboardingState(churchId, 'setup_completed');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.message || 'Failed to save centers. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                <div className="onboarding-hero">
                    <div className="onboarding-step">Step 3 of 3</div>
                    <h1 className="onboarding-title">Create your Sunday class centers</h1>
                    <p className="onboarding-copy">
                        Add centers like A1, A2, and A3. You can also skip this now because a default church-level center was already created.
                    </p>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Center Name</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="A1" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Center Code</label>
                        <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="A1" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Host Name</label>
                        <input className="form-input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="Church member name" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Host Phone</label>
                        <input className="form-input" value={form.hostPhone} onChange={(e) => setForm({ ...form, hostPhone: e.target.value })} placeholder="+91 98765 43210" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Area Name</label>
                        <input className="form-input" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} placeholder="Neighborhood or area" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House address" />
                    </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                    <button type="button" className="btn btn-primary" onClick={addDraftCenter}>Add Center</button>
                </div>

                {centers.length > 0 ? (
                    <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                        {centers.map((center) => (
                            <div key={center.id} className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{center.name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                        {center.code}
                                        {center.areaName ? ` • ${center.areaName}` : ''}
                                        {center.hostName ? ` • ${center.hostName}` : ''}
                                    </div>
                                </div>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDraftCenter(center.id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                ) : null}

                <div className="onboarding-note">
                    You can skip this and add centers later. A default `Church` center already exists so the app can still work.
                </div>

                {error ? (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                        {error}
                    </div>
                ) : null}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => finishSetup(true)} disabled={saving}>
                        Skip for now
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => finishSetup(false)} disabled={saving}>
                        {saving ? <span className="spinner" /> : 'Finish Setup'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CentersOnboardingPage() {
    return (
        <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
            <CentersOnboardingContent />
        </Suspense>
    );
}
