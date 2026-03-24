'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { PLAN_DEFINITIONS } from '../lib/plans';

const navItems = ['Platform', 'Solutions', 'Resources'];

const featureCards = [
  {
    title: 'Ministry Centers',
    copy: 'Oversee multiple locations, missions, and satellite campuses from a unified, elegant command center.',
    tone: 'indigo',
    icon: '⌂',
  },
  {
    title: 'Member Profiles',
    copy: 'Deeply understand your congregation with attendance history, role context, and pastoral visibility.',
    tone: 'sky',
    icon: '⇄',
  },
  {
    title: 'Liturgical Reporting',
    copy: 'Generate beautiful, publication-ready reporting on parish health, teams, and weekly operational progress.',
    tone: 'violet',
    icon: '◫',
  },
];

const parishNames = ['St. Judes', 'Loomis Chapel', 'Grace Cathedral', 'Trinity Global', 'Sanctuary', 'Holy Cross'];

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-brand">
            <Image
              src="/prayloomlogo.svg"
              alt="PrayLoom"
              width={196}
              height={62}
              className="landing-brand-logo"
              priority
            />
          </Link>

          <nav className="landing-nav" aria-label="Primary">
            {navItems.map((item) => (
              <a key={item} href="#!" className="landing-nav-link">
                {item}
              </a>
            ))}
          </nav>

          <div className="landing-header-actions">
            {loading ? null : user ? (
              <Link href="/dashboard" className="landing-link-button">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="landing-link-button">
                  Sign In
                </Link>
                <Link href="/signup" className="landing-primary-button">
                  Start Your Workspace
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-shell">
            <div className="landing-hero-copy-column">
              <div className="landing-hero-badge">PrayLoom</div>
              <Image
                src="/prayloomlogo.svg"
                alt="PrayLoom"
                width={244}
                height={78}
                className="landing-hero-logo"
              />
              <h1 className="landing-hero-title">
                Church operations,
                <span> beautifully organized.</span>
              </h1>
              <p className="landing-hero-copy">
                Manage centers, students, attendance, members, and ministry reporting in one premium workspace designed for the sacred.
              </p>

              <div className="landing-hero-actions">
                {user ? (
                  <Link href="/dashboard" className="landing-primary-button landing-button-large">
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="landing-primary-button landing-button-large">
                      Start Your Workspace
                    </Link>
                    <a href="#!" className="landing-secondary-button landing-button-large">
                      Book a Demo
                    </a>
                  </>
                )}
              </div>

              <div className="landing-hero-trust">
                <div className="landing-hero-avatars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="landing-hero-note">
                  Trusted by over 1,200 parishes worldwide.
                </div>
              </div>
            </div>

            <div className="landing-hero-stage">
              <div className="landing-stage-window">
                <div className="landing-stage-brand-card">
                  <Image
                    src="/prayloomlogo.svg"
                    alt="PrayLoom"
                    width={210}
                    height={66}
                    className="landing-stage-brand-logo"
                  />
                </div>

                <div className="landing-stage-card landing-stage-card-floating">
                  <div className="landing-stage-mini-label">Active Ministries</div>
                  <div className="landing-stage-mini-row">
                    <span>Youth Choir</span>
                    <strong>Active</strong>
                  </div>
                </div>

                <div className="landing-stage-card landing-stage-card-main">
                  <div className="landing-stage-kicker">Attendance</div>
                  <div className="landing-stage-title">Parish Growth</div>
                  <div className="landing-stage-growth">+14.2%</div>
                  <div className="landing-stage-chart">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="landing-stage-bar" />
                </div>

                <div className="landing-stage-card landing-stage-card-status">
                  <div className="landing-stage-status-dot" />
                  <div>
                    <div className="landing-stage-status-label">Status</div>
                    <div className="landing-stage-status-title">Sync Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-parish-row" aria-label="Trusted by parishes">
          <div className="landing-parish-label">The digital liturgy for every parish</div>
          <div className="landing-parish-grid">
            {parishNames.map((name) => (
              <div key={name} className="landing-parish-name">
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-features-shell">
            <div className="landing-section-head">
              <div className="landing-section-title">
                Management designed
                <span> with reverence.</span>
              </div>
              <div className="landing-feature-intro">
                We believe administrative tasks are sacred contributions to the community. PrayLoom provides the stillness and structure your ministry needs to thrive.
              </div>
            </div>

            <div className="landing-feature-carousel-actions" aria-hidden="true">
              <button type="button" className="landing-circle-button">
                ‹
              </button>
              <button type="button" className="landing-circle-button">
                ›
              </button>
            </div>
          </div>

          <div className="landing-feature-grid">
            {featureCards.map((feature) => (
              <div key={feature.title} className={`landing-feature-card tone-${feature.tone}`}>
                <div className="landing-feature-icon">{feature.icon}</div>
                <div className="landing-feature-title">{feature.title}</div>
                <div className="landing-feature-copy">{feature.copy}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-pricing" id="pricing">
          <div className="landing-pricing-shell">
            <div className="landing-section-head">
              <div className="landing-section-title">
                Pricing for every
                <span> church season.</span>
              </div>
              <div className="landing-feature-intro">
                Start with a simple structured plan, grow into richer reporting and spotlight moments, and expand into premium support when your ministry is ready.
              </div>
            </div>

            <div className="landing-pricing-grid">
              {PLAN_DEFINITIONS.map((plan) => (
                <div key={plan.id} className={`landing-pricing-card tone-${plan.accent}`}>
                  <div className="landing-pricing-head">
                    <div>
                      <div className="landing-pricing-name">{plan.name}</div>
                      <div className="landing-pricing-label">{plan.priceLabel}</div>
                    </div>
                    <span className="landing-pricing-pill">{plan.id === 'growth' ? 'Popular' : plan.id === 'premium' ? 'Scale' : 'Launch'}</span>
                  </div>
                  <div className="landing-pricing-subtitle">{plan.subtitle}</div>
                  <div className="landing-pricing-description">{plan.description}</div>
                  <div className="landing-pricing-limits">
                    <div><strong>{plan.limits.centers ?? 'Unlimited'}</strong> centers</div>
                    <div><strong>{plan.limits.members ?? 'Unlimited'}</strong> members</div>
                    <div><strong>{plan.limits.students ?? 'Unlimited'}</strong> students</div>
                  </div>
                  <div className="landing-pricing-list">
                    {plan.features.map((feature) => (
                      <div key={feature} className="landing-pricing-item">
                        <span className="landing-pricing-check">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/signup" className="landing-primary-button">
                    Choose {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-footer-cta">
          <div className="landing-footer-card">
            <div className="landing-footer-content">
              <div className="landing-footer-title">
                Elevate your church&apos;s
                <span> operational excellence.</span>
              </div>
              <div className="landing-footer-copy">
                Join the hundreds of ministries using PrayLoom to foster connection and simplify administration.
              </div>
            </div>
            <div className="landing-footer-actions">
              <Link href="/signup" className="landing-primary-button">
                Create Your Workspace
              </Link>
              <a href="#!" className="landing-secondary-button">
                Talk to an Expert
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
