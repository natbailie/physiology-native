# Physiology — native companion

The React Native (Expo SDK 57) app that renders the same modules as the web project at
`../physiology-app`, driven by file-synced copies of its engines.

## Running it

Prereqs: Node (`export PATH="$HOME/.nvm/versions/node/v24.11.0/bin:$PATH"` first), and a booted
iOS simulator:

```
xcrun simctl boot "iPhone 17 Pro"     # if none is booted
xcodebuild -downloadPlatform iOS      # only if `xcrun simctl list runtimes` is empty (several GB)
```

Then:

```
npx expo start
```

Press `i` for the iOS simulator or `a` for an Android emulator. The first run installs Expo Go.

Copy `.env.example` to `.env.local` for accounts, progress sync, the paywall and the tutor. With
none of it set the app runs local-only — progress on the device, every module unlocked, no tutor —
which is the same thing `physiology-app` does without a `.env.local`, and is worth keeping working.

## Layout

- `app/` — Expo Router screens. `index` (catalogue), `module/[id]` (the simulator shell),
  `account`, `pricing`, `reference`, `medications`.
- `src/engine/<module>/` — a module's file-synced engine, presentation schema, questions and
  explainer prose, plus two hand-written native files: `nativeLoopConfig.ts` and `adapter.ts`.
- `src/engine/adapters.generated.ts` — id → lazy `import()` of each adapter. Generated; see below.
- `src/engine/<module>/diagramClasses.ts` — that module's classes, ported from its own
  `Diagram.module.css`. Per module because the web scopes them with CSS modules and the same name
  means different things in different ones; the eleven shared text classes stay global in
  `DiagramView`.
- `src/presentation/` — the native renderer: `DiagramView`, `ControlRailView`, `ReadoutGridView`,
  `TrendsView`, `ScenarioBar`, `PracticePanel`, `ExplainerView`, `TutorPanel`, `organs`.
- `src/hooks/useNativeEngineLoop.ts` — the native loop: ref-held state, sub-stepping, bounded
  history, background pause.
- `src/lib/env.ts`, `src/lib/supabaseOptions.ts` — the two platform seams (below).
- `scripts/` — `sync-engines.mjs`, `generate-adapters.mjs`.

## The relationship to the web project

`../physiology-app` is the source of truth. The native app **does not import across projects** —
Metro would resolve a second copy of `react` and every hook would fail with "Invalid hook call".
Instead `scripts/sync-engines.mjs` re-derives ~500 files from it, applying only mechanical import
rewrites, and `npm run sync:check` fails if any copy has drifted.

```
npm run sync         # re-derive after a change in the web repo
npm run sync:check   # exit 1 on drift, a missing web source, or an orphaned copy
```

What crosses over: the 45 engines, their presentation schemas, question banks and explainer prose;
the module registry; the assessment layer (progress store, spaced repetition, weakness ranking);
auth; the entitlement gate; the tutor's corpus and retrieval; the theme tokens; the formulary and
the formula sheet.

What does not, and why:

| Stays behind | Reason |
| --- | --- |
| `*.module.css`, `<Name>Page.tsx`, `shared/components/`, `presentation/web/` | the web renderer; native has its own |
| `src/lib/env.ts` | reads `import.meta.env`; hand-written here against `EXPO_PUBLIC_*`. The sync script refuses to copy any source containing `import.meta` |
| `src/lib/supabaseOptions.ts` | supabase-js needs AsyncStorage and `detectSessionInUrl: false` under React Native |
| `revenuecat.ts`, `startCheckout.ts` | `@revenuecat/purchases-js` is web-only (see Known gaps) |
| `*.test.ts` | they run in the web repo, against the same sources |

## Checks

```
npm run verify   # sync:check + adapters:check + typecheck + lint
```

`npm run lint` is not decoration: `react-hooks/rules-of-hooks` and `react-hooks/set-state-in-effect`
have each caught a real bug here. Synced copies are excluded — they are lint-clean under the web
project's oxlint and policed by `sync:check` instead — but every hand-written file is linted,
including each module's `adapter.ts`.

`src/engine/adapters.generated.ts` is generated from the module directories, the same way the web
project generates its module manifest and for the same reason: Metro has no glob and Hermes rejects
`import.meta`. Run `npm run generate:adapters` after adding or removing an `adapter.ts`;
`npm run verify` fails if it is stale.

## Status

All 45 modules render, with presets, perturbations, sparkline and OD-curve charts, the frozen
baseline overlay, engine-verified practice questions, the explainer prose and the tutor. Every
`cls` the presentations use resolves, including the ones a module's engine drives through
`styleVars` — BPPV thickens vestibular's posterior canal and brings its canaliths up, as on the
web. Progress
is on-device and syncs to an account when signed in. Three modules are free and the rest are gated,
matching the web.

## Known gaps

- **No app icon or splash.** `app.json` sets neither, so Expo's defaults are used. Fine for
  simulator and emulator testing; a store build needs real artwork (1024×1024 icon, an Android
  adaptive-icon foreground, a splash image) which is a branding decision, not a code one.
- **No purchases.** Buying digital goods in an iOS or Android app must go through in-app purchase,
  which means `react-native-purchases` — a native module, so a development build rather than Expo
  Go. Entitlement is read from Supabase, so a web subscription or an institutional seat already
  unlocks this app; only buying *here* is missing.
- **No tests.** The engines are covered by the web project's suite, but the hand-written native
  code — the loop hook, the presentation views, the adapters — is covered only by typecheck and
  lint. `jest-expo` is the obvious next step.
- **Diagram animation** (flow, liver arrows) is static, and there is no transport (play/pause/step).
