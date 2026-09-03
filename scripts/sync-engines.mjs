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

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NATIVE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = resolve(NATIVE_ROOT, '..', 'physiology-app');

/** web module directory -> native engine directory */
const MODULES = {
  glucoseRegulation: 'glucose',
  cardiorenal: 'cardiorenal',
  respiratory: 'respiratory',
  adrenalCortex: 'adrenalCortex',
  adrenalMedulla: 'adrenalMedulla',
  anteriorPituitary: 'anteriorPituitary',
  hpaAxis: 'hpaAxis',
  hpgAxis: 'hpgAxis',
  hptAxis: 'hptAxis',
  calciumHomeostasis: 'calciumHomeostasis',
  cardiacElectro: 'cardiacElectro',
  ecgConduction: 'ecgConduction',
  coronaryCirculation: 'coronaryCirculation',
  venousReturn: 'venousReturn',
  respiratoryMechanics: 'respiratoryMechanics',
  renalTubular: 'renalTubular',
  electrolyteBalance: 'electrolyteBalance',
  capillaryExchange: 'capillaryExchange',
  gastrointestinal: 'gastrointestinal',
  digestionAbsorption: 'digestionAbsorption',
  enzymeKinetics: 'enzymeKinetics',
  liverPhysiology: 'liverPhysiology',
  bloodGroups: 'bloodGroups',
  coagulation: 'coagulation',
  erythropoiesis: 'erythropoiesis',
  shockStates: 'shockStates',
  inflammation: 'inflammation',
  cerebralPerfusion: 'cerebralPerfusion',
  motorControl: 'motorControl',
  somaticSensation: 'somaticSensation',
  muscleContraction: 'muscleContraction',
  neuromuscularJunction: 'neuromuscularJunction',
  hearing: 'hearing',
  vestibular: 'vestibular',
  vision: 'vision',
  cellCycle: 'cellCycle',
  micturition: 'micturition',
  pregnancy: 'pregnancy',
  exercisePhysiology: 'exercisePhysiology',
  fetalCirculation: 'fetalCirculation',
  immuneResponse: 'immuneResponse',
  hypersensitivity: 'hypersensitivity',
  thermoregulation: 'thermoregulation',
  autonomicNervous: 'autonomicNervous',
  membranePotentials: 'membranePotentials',
};

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
  '@/shared/hooks/useEngineLoop': 'src/hooks/useNativeEngineLoop',
};

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
  ];

  for (const [webModule, nativeModule] of Object.entries(MODULES)) {
    const engineDir = join(WEB_ROOT, 'src/modules', webModule, 'engine');
    for (const name of readdirSync(engineDir).sort()) {
      if (!isCopiedEngineFile(name)) continue;
      entries.push({
        web: `src/modules/${webModule}/engine/${name}`,
        native: `src/engine/${nativeModule}/${name}`,
      });
    }
    for (const name of ['presentation.ts', 'questions.ts']) {
      entries.push({
        web: `src/modules/${webModule}/${name}`,
        native: `src/engine/${nativeModule}/${name}`,
      });
    }
  }

  return entries;
}

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
      // Only directories that exist purely to hold synced copies are policed.
      if (dir.startsWith('src/engine/') || dir === 'src/shared/assessment') orphans.push(`${dir}/${name}`);
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
let written = 0;

for (const { web, native } of entries) {
  const webAbs = join(WEB_ROOT, web);
  const nativeAbs = join(NATIVE_ROOT, native);

  if (!existsSync(webAbs)) {
    missing.push(`${web} (web source for ${native})`);
    continue;
  }

  const expected = transform(readFileSync(webAbs, 'utf8'), native);
  const actual = existsSync(nativeAbs) ? readFileSync(nativeAbs, 'utf8') : null;
  if (actual === expected) continue;

  if (check) {
    drifted.push(actual === null ? `${native} (not copied yet)` : native);
  } else {
    writeFileSync(nativeAbs, expected);
    written += 1;
  }
}

const orphans = findOrphans(entries);

if (!check) {
  console.log(`sync-engines: ${written} file(s) written, ${entries.length - written} already in sync.`);
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

if (drifted.length || missing.length || orphans.length) process.exit(1);
if (check) console.log(`sync-engines: ${entries.length} copied file(s) all in sync with ../physiology-app.`);
