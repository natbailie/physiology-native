# Physiology — native companion

The renderer-agnostic React Native (Expo / SDK 52) app that renders the same `presentation.ts`
data as the web app, driven by a byte-for-byte copy of the glucose engine.

## Running it

Prereqs: Node (use `export PATH="$HOME/.nvm/versions/node/v24.11.0/bin:$PATH"` first), a booted iOS
simulator, and an installed iOS runtime:

```
xcrun simctl boot "iPhone 17 Pro"     # if no simulator is booted
xcodebuild -downloadPlatform iOS      # only if `xcrun simctl list runtimes` is empty (several GB)
```

Then from this directory:

```
npx expo start
```

Press `i` in the Expo terminal to open on the booted iOS simulator, or `w` for the web. The first
run installs Expo Go onto the simulator automatically.

### Development build (optional, production-realistic)

The Expo Go route above is quick. For a real native shell (`expo run:ios`) you also need CocoaPods:

```
gem install cocoapods
npx expo run:ios
```

## Layout

- `app/` — Expo Router screens (`index.tsx` module picker, `module/[id].tsx` module screen).
- `src/presentation/` — renderer-agnostic schema types (`types.ts` / `presentationTypes.ts`,
  an in-sync copy of the web `src/shared/presentation/types.ts`) and the presentation views
  (`DiagramView`, `ControlRailView`, `ReadoutGridView`, `TrendsView`, `ScenarioBar`, `organs`,
  `PracticePanel`).
- `src/engine/<module>/` — byte-for-byte copies of the web engines (`glucose`, `cardiorenal`,
  `respiratory`), plus each module's `presentation.ts`, `presets.ts`, `questions.ts` (the web
  practice-question data) and a `nativeLoopConfig.ts`.
  Imports are rewritten to local relative paths and `@/shared/lib/math` is served by
  `src/engine/math.ts` (a byte-identical copy). `loopConfig` types point at the native
  `useNativeEngineLoop`. Proven equivalent: cardiorenal settles to MAP 93 / GFR 100 / CO 4.9 L/min,
  respiratory to pH 7.40 / PaCO2 40 / HCO3 24.
- `src/shared/assessment/` — pure-TS ports of the web assessment layer: `types.ts`
  (`Direction`, `PredictQuestion` / `PatternQuestion`), `verifyQuestion.ts` (`runQuestion`) and
  `verifyPattern.ts` (`readPanel` / `runPatternQuestion`). The practice panel settles each
  question against the native engine at render time, so a keyed answer can never drift from the
  model.
- `src/hooks/useNativeEngineLoop.ts` — the native loop (ref-held state, sub-stepping, bounded
  history, background pause).
- `scripts/sync-engines.mjs` — re-derives the file-synced copies from the web repo; see below.

## Deliberate difference from the web project

The web repo is the source of truth. The native app **does not import across projects** — the
schema and engine are file-synced copies. Do not re-add the sibling project to `metro.config.js`
`watchFolders` / `nodeModulesPaths`, because Metro then resolves a second copy of `react` and every
hook fails with "Invalid hook call", and do not add a `paths` alias into `../physiology-app` in
`tsconfig.json` either — `tsc` would resolve it and Metro would not.

Keeping the copies honest is mechanical rather than a matter of care. `scripts/sync-engines.mjs`
re-derives every copied file from `../physiology-app`, applying the only differences that are
allowed to exist — five import rewrites:

| Web import | Native import |
| --- | --- |
| `@/shared/lib/math` | `src/engine/math` |
| `@/shared/presentation/types` | `src/presentation/presentationTypes` |
| `@/shared/assessment/types` | `src/shared/assessment/types` |
| `@/shared/hooks/useEngineLoop` | `src/hooks/useNativeEngineLoop` (`EngineLoopConfig` → `NativeLoopConfig`) |
| `./engine/<name>` | `./<name>` |

```
npm run sync         # re-derive the copies after a change in the web repo
npm run sync:check   # exit 1 if any copy has drifted (also flags a copy whose web source is gone)
```

42 files are covered. Web tests, `loopConfig.ts` and `references.ts` are deliberately not copied;
`nativeLoopConfig.ts`, `src/hooks/`, `src/presentation/*.tsx` and `app/` are hand-written here.

## Checks

```
npm run verify   # sync:check + typecheck + lint
```

`npm run lint` runs ESLint with `eslint-config-expo`. It is not optional decoration: the
`react-hooks` rules are what catch a hook called outside a component body, and a ref read during
render — both of which had already happened in `useNativeEngineLoop.ts` before the linter existed.
Lint runs with `--max-warnings 0`. The file-synced copies are excluded (they are linted in the web
repo under its own oxlint config, and any fix here would be reverted by `npm run sync`).

## Status

All three free modules render live and interactively: **glucose** (presets + Eat meal / Give
insulin), **cardiorenal** (presets + Haemorrhage), **respiratory** (presets + Airway obstruction),
each with its sparkline / OD-curve charts. Each chart carries the **frozen-baseline overlay**: set a
baseline on a patient's normal run and the running trace draws over it as a dashed reference, for
two-run comparisons ("normal host versus deficient host"). Each module also carries a **Practice**
panel — the web's engine-verified predict-then-run and pattern-discrimination questions (21 across
the three modules), which settle the native engine at render time and reveal correct / incorrect,
the before → after direction, and the clinical explanation, with a "Run in simulator" hop that
applies the question's setup *and* intervention to the live loop so the learner watches it play out.
Diagram flow/liver-arrow animations are static and a simulate-transport UI is not yet implemented.
