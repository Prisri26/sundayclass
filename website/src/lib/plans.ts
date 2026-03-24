export type PlanId = 'starter' | 'growth' | 'premium';

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  subtitle: string;
  description: string;
  limits: {
    centers: number | null;
    members: number | null;
    students: number | null;
  };
  features: string[];
  accent: 'blue' | 'sky' | 'stone';
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: 'Start free',
    subtitle: 'For a small church beginning with structured attendance.',
    description: 'Launch one church workspace, organize a few centers, and begin taking attendance with confidence.',
    limits: {
      centers: 3,
      members: 5,
      students: 150,
    },
    features: ['Students', 'Attendance', 'Basic reports', 'Church branding'],
    accent: 'blue',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: 'Most popular',
    subtitle: 'For churches with multiple centers and larger ministry teams.',
    description: 'Expand center operations, invite more members, and unlock richer reporting and spotlight moments.',
    limits: {
      centers: 10,
      members: 25,
      students: null,
    },
    features: ['Everything in Starter', 'Advanced reports', 'Spotlight / Live feed', 'Expanded team access'],
    accent: 'sky',
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: 'Tailored for scale',
    subtitle: 'For larger ministries that need flexibility, visibility, and support.',
    description: 'Run a fully scaled church operation with premium analytics, deeper branding, and future enterprise features.',
    limits: {
      centers: null,
      members: null,
      students: null,
    },
    features: ['Everything in Growth', 'Unlimited centers', 'Unlimited members', 'Priority support'],
    accent: 'stone',
  },
];

export const DEFAULT_PLAN_ID: PlanId = 'starter';

export function getPlanDefinition(planId: string | null | undefined): PlanDefinition {
  return PLAN_DEFINITIONS.find((plan) => plan.id === planId) || PLAN_DEFINITIONS[0];
}
