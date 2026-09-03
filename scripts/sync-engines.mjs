#!/usr/bin/env node
/**
 * Re-derive the file-synced copies of the web project's engine, presentation schema and assessment
 * layer into this project.
 *
 * The web repo (`../physiology-app`) is the source of truth. This app deliberately does NOT import
 * across projects — doing so makes Metro resolve a second copy of `react` and every hook fails with
 * "Invalid hook call" (see the comment in metro.config.js). So the shared code is copied in, with
 * the web project's `@/...` path aliases rewritten to local relative imports.
 *
 * Every rewrite is mechanical and listed below, which is what makes the copies checkable: a synced
 * file must equal its web source with the alias lines rewritten and nothing else changed.
 *
 *   node scripts/sync-engines.mjs            # write the copies
 *   node scripts/sync-engines.mjs --check    # exit 1 if any copy has drifted (CI / pre-commit)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NATIVE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = resolve(NATIVE_ROOT, '..', 'physiology-app');

/**
 * The modules to copy: every directory under the web project's `src/modules` that carries both a
 * `questions.ts` and a `content.ts`.
 *
 * That is the exact predicate `tools/module-manifest/generate.mjs` uses upstream, so this set and
 * the one in the synced `manifest.generated.ts` cannot disagree — which is what lets that file be
 * copied rather than regenerated here.
 *
 * This was a hand-written map of 45 web-directory -> native-directory pairs. Every pair but one
 * was an identity, and the exception (glucoseRegulation -> glucose) is gone: the native directory
 * is now named for the module id, like every other, so the manifest's `./glucoseRegulation/content`
 * resolves here too.
 */
function modulesOf(webRoot) {
  const dir = join(webRoot, 'src/modules');
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .filter(
      (name) =>
        existsSync(join(dir, name, 'questions.ts')) && existsSync(join(dir, name, 'content.ts')),
    )
    .sort();
}

/**
 * Web engine files that are deliberately not copied: tests stay in the web repo (they run under
 * vitest against the same sources), `loopConfig.ts` is replaced by the hand-written
 * `nativeLoopConfig.ts`, and `references.ts` is web-only citation copy.
 */
const SKIP_ENGINE_FILES = new Set(['loopConfig.ts', 'references.ts']);
const isCopiedEngineFile = (name) =>
  name.endsWith('.ts') && !name.endsWith('.test.ts') && !SKIP_ENGINE_FILES.has(name);

/** Native files in a synced directory that are hand-written here and have no web source. */
const NATIVE_ONLY = new Set(['nativeLoopConfig.ts']);

/* ------------------------------------------------------------------ */
/*  Import rewrites                                                    */
/* ------------------------------------------------------------------ */

/** Native modules the web aliases resolve to, as paths relative to NATIVE_ROOT. */
const ANCHORS = {
  '@/shared/lib/math': 'src/engine/math',
  '@/shared/presentation/types': 'src/presentation/presentationTypes',
  '@/shared/diagram/organShapes': 'src/presentation/organShapes',
  '@/shared/assessment/types': 'src/shared/assessment/types',
  '@/shared/assessment/verifyQuestion': 'src/shared/assessment/verifyQuestion',
  '@/shared/assessment/verifyPattern': 'src/shared/assessment/verifyPattern',
  // The manifest keeps its own relative `./<module>/content` imports, which resolve because the
  // native engine directories are named for the module id. It lands beside them for that reason.
  '@/modules/manifest.generated': 'src/engine/manifest.generated',
  '@/shared/assessment/weakness': 'src/shared/assessment/weakness',
  '@/shared/assessment/scheduling': 'src/shared/assessment/scheduling',
  '@/shared/assessment/useProgressStore': 'src/shared/assessment/useProgressStore',
  '@/home/moduleRegistry': 'src/home/moduleRegistry',
  '@/shared/glossary/terms': 'src/shared/glossary/terms',
  '@/medications/drugs': 'src/medications/drugs',
  '@/reference/formulas': 'src/reference/formulas',
  '@/lib/supabase': 'src/lib/supabase',
  '@/auth/AuthContext': 'src/auth/AuthContext',
  '@/shared/hooks/useEngineLoop': 'src/hooks/useNativeEngineLoop',
  // Every module's content.ts, and the tutor's corpus reader, take only the CONTENT SHAPE from
  // the web's ExplainerPanel — `import type { ExplainerContent }`. The shape lives in its own
  // pure module upstream and the component re-exports it, so the alias the copies carry resolves
  // to that module here rather than to a React component with a CSS module attached.
  '@/shared/components/ExplainerPanel/ExplainerPanel': 'src/shared/explainer/types',
};

/**
 * Whether a source actually READS `import.meta`, as opposed to mentioning it.
 *
 * `import.meta` is a compile-time error under Hermes, and src/lib/env.ts exists precisely so that
 * one web module owns that read — a copy reaching for it wants a platform seam instead. But the
 * files that were changed to make them shareable say so in their own docblocks ("this used to be
 * an `import.meta.glob`"), and refusing those would reject the very files the effort produced.
 * So comments are stripped before the check.
 */
function readsImportMeta(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  return /\bimport\s*\.\s*meta\b/.test(withoutComments);
}

/** An import specifier from `fromNativePath` to `toNativePath`, both relative to NATIVE_ROOT. */
function relativeSpecifier(fromNativePath, toNativePath) {
  const spec = posix.relative(posix.dirname(fromNativePath), toNativePath);
  return spec.startsWith('.') ? spec : `./${spec}`;
}

function transform(source, nativePath) {
  let out = source;

  for (const [alias, anchor] of Object.entries(ANCHORS)) {
    if (!out.includes(alias)) continue;
    const spec = relativeSpecifier(nativePath, anchor);
    out = out.replaceAll(`'${alias}'`, `'${spec}'`);
  }

  // The web keeps a module's engine in an `engine/` subdirectory; here it is the directory itself.
  out = out.replaceAll("from './engine/", "from './");

  // The same fact stated through the `@/` alias, which is how a file outside the module reaches
  // one of its engine parts — `reference/formulas.ts` imports eight of them. One rule rather than
  // eight anchors, and it works for any module because the native directory is named for the id.
  out = out.replace(/'@\/modules\/([A-Za-z0-9]+)\/engine\/([A-Za-z0-9/]+)'/g, (_m, mod, rest) =>
    `'${relativeSpecifier(nativePath, `src/engine/${mod}/${rest}`)}'`);

  // The web loop hook and the native one are different implementations of the same contract.
  out = out.replaceAll(/\bEngineLoopConfig\b/g, 'NativeLoopConfig');

  return out;
}

/* ------------------------------------------------------------------ */
/*  Manifest                                                           */
/* ------------------------------------------------------------------ */

/** @returns {{web: string, native: string}[]} paths relative to their respective roots */
function buildManifest() {
  const     entries = [
    { web: 'src/shared/lib/math.ts', native: 'src/engine/math.ts' },
    { web: 'src/shared/presentation/types.ts', native: 'src/presentation/presentationTypes.ts' },
    { web: 'src/shared/diagram/organShapes.ts', native: 'src/presentation/organShapes.ts' },
    { web: 'src/shared/assessment/types.ts', native: 'src/shared/assessment/types.ts' },
    { web: 'src/shared/assessment/verifyQuestion.ts', native: 'src/shared/assessment/verifyQuestion.ts' },
    { web: 'src/shared/assessment/verifyPattern.ts', native: 'src/shared/assessment/verifyPattern.ts' },
    { web: 'src/theme/tokens.generated.ts', native: 'src/presentation/tokens.generated.ts' },
    { web: 'src/shared/lib/ringBuffer.ts', native: 'src/shared/lib/ringBuffer.ts' },
    { web: 'src/shared/assessment/scheduling.ts', native: 'src/shared/assessment/scheduling.ts' },
    { web: 'src/shared/assessment/progressStore.ts', native: 'src/shared/assessment/progressStore.ts' },
    { web: 'src/shared/assessment/weakness.ts', native: 'src/shared/assessment/weakness.ts' },
    { web: 'src/home/moduleRegistry.ts', native: 'src/home/moduleRegistry.ts' },
    { web: 'src/shared/components/ExplainerPanel/types.ts', native: 'src/shared/explainer/types.ts' },
    { web: 'src/lib/supabase.ts', native: 'src/lib/supabase.ts' },
    { web: 'src/auth/AuthContext.tsx', native: 'src/auth/AuthContext.tsx' },
    { web: 'src/shared/assessment/supabaseProgressStore.ts', native: 'src/shared/assessment/supabaseProgressStore.ts' },
    { web: 'src/shared/assessment/useProgressStore.ts', native: 'src/shared/assessment/useProgressStore.ts' },
    { web: 'src/shared/assessment/useQuizSession.ts', native: 'src/shared/assessment/useQuizSession.ts' },
    { web: 'src/billing/config.ts', native: 'src/billing/config.ts' },
    { web: 'src/billing/useEntitlement.ts', native: 'src/billing/useEntitlement.ts' },
    { web: 'src/billing/licence.ts', native: 'src/billing/licence.ts' },
    { web: 'src/shared/assessment/useModulePractice.ts', native: 'src/shared/assessment/useModulePractice.ts' },
    { web: 'src/modules/manifest.generated.ts', native: 'src/engine/manifest.generated.ts' },
    { web: 'src/home/moduleQuestionIds.ts', native: 'src/home/moduleQuestionIds.ts' },
    { web: 'src/home/useModuleProgress.ts', native: 'src/home/useModuleProgress.ts' },
    { web: 'src/shared/chat/corpus.ts', native: 'src/shared/chat/corpus.ts' },
    { web: 'src/shared/chat/retrieve.ts', native: 'src/shared/chat/retrieve.ts' },
    { web: 'src/shared/chat/corpusAnswer.ts', native: 'src/shared/chat/corpusAnswer.ts' },
    { web: 'src/shared/chat/systemPrompt.ts', native: 'src/shared/chat/systemPrompt.ts' },
    { web: 'src/shared/glossary/terms.ts', native: 'src/shared/glossary/terms.ts' },
    { web: 'src/medications/drugs.ts', native: 'src/medications/drugs.ts' },
    { web: 'src/reference/formulas.ts', native: 'src/reference/formulas.ts' },
  ];

  for (const module of modulesOf(WEB_ROOT)) {
    const engineDir = join(WEB_ROOT, 'src/modules', module, 'engine');
    for (const name of readdirSync(engineDir).sort()) {
      if (!isCopiedEngineFile(name)) continue;
      entries.push({
        web: `src/modules/${module}/engine/${name}`,
        native: `src/engine/${module}/${name}`,
      });
    }
    for (const name of ['presentation.ts', 'questions.ts', 'content.ts']) {
      entries.push({
        web: `src/modules/${module}/${name}`,
        native: `src/engine/${module}/${name}`,
      });
    }
  }

  return entries;
}

/** Directories that hold nothing but synced copies, so anything else in them is an orphan. */
const SYNCED_ONLY_DIRS = new Set([
  'src/shared/assessment',
  'src/shared/lib',
  'src/shared/explainer',
  'src/home',
  'src/auth',
  'src/billing',
  'src/shared/chat',
  'src/shared/glossary',
  'src/medications',
  'src/reference',
]);

/** Native files sitting in a synced directory with no web source — a rename or deletion upstream. */
function findOrphans(entries) {
  const expected = new Map();
  for (const { native } of entries) {
    const dir = posix.dirname(native);
    if (!expected.has(dir)) expected.set(dir, new Set());
    expected.get(dir).add(posix.basename(native));
  }
  const orphans = [];
  for (const [dir, names] of expected) {
    const abs = join(NATIVE_ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs).sort()) {
      if (!name.endsWith('.ts') && !name.endsWith('.tsx')) continue;
      if (names.has(name) || NATIVE_ONLY.has(name)) continue;
      // Only directories that exist purely to hold synced copies are policed. src/presentation
      // is not among them: it mixes synced schema with hand-written views.
      if (dir.startsWith('src/engine/') || SYNCED_ONLY_DIRS.has(dir)) orphans.push(`${dir}/${name}`);
    }
  }
  return orphans;
}

/* ------------------------------------------------------------------ */
/*  Run                                                                */
/* ------------------------------------------------------------------ */

const check = process.argv.includes('--check');

if (!existsSync(WEB_ROOT)) {
  console.error(`sync-engines: the web project is not at ${WEB_ROOT}.`);
  console.error('It is the source of truth for the copied engine; clone it beside this project.');
  process.exit(1);
}

const entries = buildManifest();
const drifted = [];
const missing = [];
const reachedForImportMeta = [];
let written = 0;

for (const { web, native } of entries) {
  const webAbs = join(WEB_ROOT, web);
  const nativeAbs = join(NATIVE_ROOT, native);

  if (!existsSync(webAbs)) {
    missing.push(`${web} (web source for ${native})`);
    continue;
  }

  const source = readFileSync(webAbs, 'utf8');
  if (readsImportMeta(source)) {
    reachedForImportMeta.push(web);
    continue;
  }
  const expected = transform(source, native);
  const actual = existsSync(nativeAbs) ? readFileSync(nativeAbs, 'utf8') : null;
  if (actual === expected) continue;

  if (check) {
    drifted.push(actual === null ? `${native} (not copied yet)` : native);
  } else {
    // A new manifest entry may be the first file in its directory.
    mkdirSync(dirname(nativeAbs), { recursive: true });
    writeFileSync(nativeAbs, expected);
    written += 1;
  }
}

const orphans = findOrphans(entries);

if (!check) {
  console.log(`sync-engines: ${written} file(s) written, ${entries.length - written} already in sync.`);
}

if (reachedForImportMeta.length) {
  console.error('\nsync-engines: these web sources read import.meta and cannot be copied:');
  for (const m of reachedForImportMeta) console.error(`  - ${m}`);
  console.error('Give the module a platform seam (see src/lib/env.ts) rather than copying it.');
}
if (missing.length) {
  console.error('\nsync-engines: web sources this manifest expects are gone:');
  for (const m of missing) console.error(`  - ${m}`);
}
if (orphans.length) {
  console.error('\nsync-engines: native copies with no web source (renamed or deleted upstream?):');
  for (const o of orphans) console.error(`  - ${o}`);
}
if (drifted.length) {
  console.error('\nsync-engines: these copies have drifted from the web project:');
  for (const d of drifted) console.error(`  - ${d}`);
  console.error('\nRun `npm run sync` to re-derive them from ../physiology-app.');
}

if (drifted.length || missing.length || orphans.length || reachedForImportMeta.length) process.exit(1);
if (check) console.log(`sync-engines: ${entries.length} copied file(s) all in sync with ../physiology-app.`);
