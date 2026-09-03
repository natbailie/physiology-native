/**
 * The native half of the seam described in the web project's `supabaseOptions.ts`.
 *
 * React Native has no `localStorage` for supabase-js to persist a session in, and no URL for a
 * session to arrive in, so both have to be supplied here. Without `detectSessionInUrl: false`
 * the client reaches for `window.location` on startup and throws.
 *
 * AsyncStorage rather than SecureStore: this holds a refresh token, and SecureStore caps a value
 * at 2048 bytes, which a Supabase session can exceed — a silent write failure would sign the
 * learner out at random. The device keychain is the right home for it once the session is small
 * enough to fit, or once it is split across keys.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClientOptions } from '@supabase/supabase-js';

export const supabaseOptions: SupabaseClientOptions<'public'> = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};
