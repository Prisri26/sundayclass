'use client';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_PLAN_ID, getPlanDefinition, PlanDefinition, PlanId } from './plans';

export type ChurchSubscription = {
  planId: PlanId;
  planName: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  billingCycle: string;
  isActive: boolean;
  trialEndsAt: unknown | null;
  limits: PlanDefinition['limits'];
};

export async function getChurchSubscription(churchId: string): Promise<ChurchSubscription> {
  const ref = doc(db, `churches/${churchId}/settings`, 'subscription');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const fallbackPlan = getPlanDefinition(DEFAULT_PLAN_ID);
    return {
      planId: fallbackPlan.id,
      planName: fallbackPlan.name,
      status: 'trial',
      billingCycle: 'manual',
      isActive: true,
      trialEndsAt: null,
      limits: fallbackPlan.limits,
    };
  }

  const data = snap.data() as Partial<ChurchSubscription>;
  const plan = getPlanDefinition(data.planId || DEFAULT_PLAN_ID);

  return {
    planId: plan.id,
    planName: data.planName || plan.name,
    status: data.status || 'trial',
    billingCycle: data.billingCycle || 'manual',
    isActive: data.isActive ?? true,
    trialEndsAt: data.trialEndsAt ?? null,
    limits: data.limits || plan.limits,
  };
}
