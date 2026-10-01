/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Nothing secret ships in the app binary. `EXPO_PUBLIC_*` values are compiled into the bundle, so
 * only the Supabase anon key (RLS-protected) and RevenueCat's public SDK keys may use that prefix.
 * Model-provider, service-role and webhook secrets live in the Supabase edge functions.
 */
const ROOT = path.resolve(__dirname, '../..');
const SERVER_ONLY = [
  'GEMINI_API_KEY',
  'MISTRAL_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REVENUECAT_SECRET_API_KEY',
  'REVENUECAT_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];
const KEY_SHAPES = [/sk-[A-Za-z0-9]{20,}/, /AIza[0-9A-Za-z_-]{30,}/, /sk_live_[0-9A-Za-z]+/, /sbp_[0-9a-f]{30,}/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|json)$/.test(name) ? [full] : [];
  });
}

const FILES = [...sourceFiles(path.join(ROOT, 'app')), ...sourceFiles(path.join(ROOT, 'src')), path.join(ROOT, 'app.json')].filter(
  (file) => !file.endsWith('secrets.test.ts'),
);

describe('app source', () => {
  it.each(SERVER_ONLY)('never mentions %s', (secret) => {
    const offenders = FILES.filter((file) => readFileSync(file, 'utf8').includes(secret));
    expect(offenders).toEqual([]);
  });

  it('contains no key-shaped literals', () => {
    const offenders = FILES.filter((file) => KEY_SHAPES.some((shape) => shape.test(readFileSync(file, 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('reads EXPO_PUBLIC_ variables only from the allowed public names', () => {
    const allowed = new Set([
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY',
      'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
      'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
    ]);
    const used = new Set(FILES.flatMap((file) => readFileSync(file, 'utf8').match(/EXPO_PUBLIC_[A-Z_]+\*?/g) ?? []));
    // A wildcard or trailing underscore is a prefix mentioned in prose, not a variable.
    for (const name of used) if (/[*_]$/.test(name)) used.delete(name);
    expect([...used].filter((name) => !allowed.has(name))).toEqual([]);
  });
});
