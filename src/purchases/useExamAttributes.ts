import { useEffect } from 'react';
import { useAuthOptional } from '../auth/AuthContext';
import { useExamProfile } from '../account/examProfile';
import { setExamAttributes } from './revenuecat';

/**
 * Keep RevenueCat's copy of the learner's exam in step with ours.
 *
 * Mounted once, at the root, and runs on sign-in and on every later change. The web cannot do
 * this — its SDK is an 840 kB lazy chunk that would then load for every signed-in learner, so it
 * sends the same attributes from the pricing page instead. `react-native-purchases` is a native
 * module linked into the binary either way, so here the honest moment is the moment it changes.
 *
 * Renders nothing and never blocks: `setExamAttributes` swallows its own failure.
 */
export function useExamAttributes(): void {
  const { user } = useAuthOptional() ?? { user: null };
  const { targetExam, trainingLevel, ready } = useExamProfile();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId === null || !ready) return;
    void setExamAttributes(userId, { targetExam, trainingLevel });
  }, [userId, ready, targetExam, trainingLevel]);
}
