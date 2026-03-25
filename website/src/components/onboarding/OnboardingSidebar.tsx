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
                    <span className="onboard-check-caption">
                      {step.status === 'active' ? 'Current step' : step.status === 'done' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="onboard-sidebar-motion-card">
          <div className="onboard-sidebar-motion-orb" />
          <div className="onboard-sidebar-motion-label">Onboarding Flow</div>
          <div className="onboard-sidebar-motion-title">Calm, guided setup for a branded church workspace.</div>
          <div className="onboard-sidebar-motion-copy">
            PrayLoom should feel like one deliberate journey, not a stack of forms. Each step prepares the next one.
          </div>
        </div>
      </div>

      <div className="onboard-sidebar-footer">
        <div className="onboard-sidebar-quote">{quote}</div>
      </div>

      {contextTitle ? (
        <div className="onboard-sidebar-floating-context">
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
        </div>
      ) : null}
    </aside>
  );
}
