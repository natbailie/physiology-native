/**
 * The native counterpart of the web project's `src/lib/env.ts`, and the reason that file exists.
 *
 * Its docblock states the contract: it is the only module in the web `src/` allowed to read
 * `import.meta.env`, so that everything importing it can be shared byte-for-byte with this app.
 * Vite and Metro agree that environment variables are inlined at build time into a plain module,
 * but they read them through different globals — Vite exposes `import.meta.env.VITE_*`, Metro
 * exposes `process.env.EXPO_PUBLIC_*`, and `import.meta` is a compile-time error under Hermes.
 * So this module is hand-written here rather than copied, and `scripts/sync-engines.mjs` refuses
 * to copy any web source containing `import.meta` so the boundary cannot be crossed by accident.
 *
 * Absent variables are the supported case, not a failure: with none of these set the app runs
 * local-only — progress in on-device storage, no accounts, no paywall — exactly as the web app
 * does without a .env.local.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const revenueCatPublicKey = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY;

/**
 * False here, always, and deliberately not `__DEV__`.
 *
 * The only thing this gates in shared code is the tutor's endpoint: `useChat` sends to the
 * same-origin `/api/chat` in development and to the deployed edge function otherwise. That dev
 * route is a Vite middleware (see `tutorDevRoute` in the web project's vite.config.ts), and it
 * has no native equivalent — `fetch('/api/chat')` has no origin to resolve against under React
 * Native and would simply fail. So this app always talks to the edge function, in development as
 * in production, and the tutor needs EXPO_PUBLIC_SUPABASE_URL set to work at all.
 */
export function isDev(): boolean {
  return false;
}

export { supabaseUrl, supabaseAnonKey, revenueCatPublicKey };
