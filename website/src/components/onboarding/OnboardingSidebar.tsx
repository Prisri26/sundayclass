'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

type StepItem = {
  label: string;
  status: 'done' | 'active' | 'upcoming';
};

type ContextMeta = {
  label: string;
  value: string;
};

type Props = {
  progressPercent: number;
  progressCopy: string;
  steps: StepItem[];
  quote: string;
  contextEyebrow?: string;
  contextTitle?: string;
  contextCopy?: string;
  contextMeta?: ContextMeta[];
};

export default function OnboardingSidebar({
  progressPercent,
  progressCopy,
  steps,
  quote,
  contextEyebrow,
  contextTitle,
  contextCopy,
  contextMeta = [],
}: Props) {
  const defaultCaptions: Record<string, string> = {
    'Plan Selection': 'Choose your tier',
    'Workspace Basics': 'Church information',
    'Identity & Branding': 'Visual identity',
    'Center Setup': 'Ministry structure',
    'Team Invitation': 'Add your team',
  };

  const activeStepIndex = steps.findIndex((step) => step.status === 'active');
  const railProgressPercent =
    activeStepIndex <= 0 ? 0 : (activeStepIndex / Math.max(steps.length - 1, 1)) * 100;

  return (
    <aside className="onboard-sidebar">
      <div className="onboard-sidebar-content">
        <Link href="/" className="onboard-brand">
          <Image src="/prayloomlogo.svg" alt="PrayLoom" width={196} height={58} className="onboard-brand-logo" />
        </Link>

        <div className="onboard-progress-block">
          <div className="onboard-progress-label">Progress</div>
          <div className="onboard-progress-bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="onboard-progress-copy">{progressCopy}</div>

          <div className="onboard-step-rail">
            <div className="onboard-step-rail-line" />
            <div className="onboard-step-rail-progress" style={{ height: `${railProgressPercent}%` }} />
            <div className="onboard-checklist">
              {steps.map((step, index) => (
                <div
                  key={step.label}
                  className={`onboard-check-item ${step.status === 'active' ? 'active' : ''} ${step.status === 'done' ? 'done' : ''}`}
                >
                  <div className="onboard-check-icon-wrap">
                    <div className="onboard-check-icon">{step.status === 'done' ? '✓' : index + 1}</div>
                  </div>
                  <div className="onboard-check-copy">
                    <span className="onboard-check-title">{step.label}</span>
                    <span className="onboard-check-caption">{defaultCaptions[step.label] || 'Setup step'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {contextTitle ? (
          <div className="onboard-context-card">
            {contextEyebrow ? <div className="onboard-context-eyebrow">{contextEyebrow}</div> : null}
            <div className="onboard-context-title">{contextTitle}</div>
            {contextCopy ? <div className="onboard-context-copy">{contextCopy}</div> : null}
            {contextMeta.length ? (
              <div className="onboard-context-meta">
                {contextMeta.map((item) => (
                  <span key={`${item.label}-${item.value}`}>
                    {item.value} {item.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="onboard-sidebar-footer">
        <div className="onboard-sidebar-quote">{quote}</div>
      </div>
    </aside>
  );
}
