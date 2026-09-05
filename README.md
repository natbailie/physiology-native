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

### Buying things needs a development build

`react-native-purchases` is a native module, so Expo Go cannot load it — it throws
`[RevenueCat] Native module (RNPurchases) not found`. Everything else works in Expo Go; the
Subscribe button does not. For that, build the dev client once:

```
npx eas-cli build --profile development --platform android   # installable APK
npx eas-cli build --profile development --platform ios       # simulator build
```

Then `npx expo start --dev-client` as usual. The JS is still bundled locally, so `EXPO_PUBLIC_*`
values come from your own `.env.local` and the keys never go near the build servers — build the
shell once, iterate locally after that.

RevenueCat's **Test Store** works in development builds specifically (not preview or production
ones), which is what makes a purchase testable with no paid developer account and no store
products. Put the Test Store key in `EXPO_PUBLIC_REVENUECAT_PUBLIC_KEY`.

## Layout

- `app/` — Expo Router screens. A root stack holds `(tabs)` plus the two screens that push over
  the tab bar: `module/[id]` (the simulator shell, which wants the full screen height) and
  `pricing`. The tabs are `(home)` — itself a stack of the catalogue's three tiers, `index`
  (subjects) → `discipline/[id]` (themes) → `theme/[id]` (modules), mirroring the web's
  `#home` → `#discipline/<id>` → `#theme/<id>` — plus `reference`, `medications` and `account`.
- `src/engine/<module>/` — a module's file-synced engine, presentation schema, questions and
  explainer prose, plus two hand-written native files: `nativeLoopConfig.ts` and `adapter.ts`.
- `src/engine/adapters.generated.ts` — id → lazy `import()` of each adapter. Generated; see below.
- `src/engine/<module>/diagramClasses.ts` — that module's classes, ported from its own
  `Diagram.module.css`. Per module because the web scopes them with CSS modules and the same name
  means different things in different ones; the eleven shared text classes stay global in
  `DiagramView`.
- `src/presentation/` — the native renderer: `DiagramView`, `ControlRailView`, `ReadoutGridView`,
  `ReadoutStrip`, `TrendsView`, `ScenarioBar`, `PracticePanel`, `ExplainerView`, `TutorPanel`,
  `organs`, plus the shell it is all drawn in: `theme.ts` (the design tokens and the
  light/dark/system preference), `cards/` (the three catalogue tiles, ported from the web's),
  `StudyStrip`, `StudyReport`, `SegmentedControl`, `ThemeToggle`, `haptics`.
- `src/presentation/theme.ts` is the only place a colour is named. Every screen reads its palette
  from there, resolved out of the file-synced `tokens.generated.ts` for both themes — there are no
  colour literals in `app/`. `StudyStrip` and `StudyReport` are hand-written ports of the web's
  `src/home/` components and live here rather than beside their counterparts because `src/home` is
  a sync-policed directory (see SYNCED_ONLY_DIRS in `scripts/sync-engines.mjs`).
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
| `revenuecat.ts`, `startCheckout.ts` | `@revenuecat/purchases-js` is the *web* SDK; the native one lives in `src/purchases/` and has no web source |
| `*.test.ts` | they run in the web repo, against the same sources |

## Purchases

`src/purchases/` is the only part of the paywall that is native-only, and it is deliberately
outside `src/billing/` — that directory is in `SYNCED_ONLY_DIRS`, so every file in it must be a
byte-for-byte copy of a web source and `sync:check` reports anything else as an orphan.

- `revenuecat.ts` — the RevenueCat native SDK, and a close sibling of the web project's
  `src/billing/revenuecat.ts`: same App User ID, same offering, same `full_access` entitlement,
  different store. The **App User ID is the Supabase user id**, which is what lets the webhook in
  `physiology-app/supabase/functions/revenuecat-webhook` join `app_user_id` straight onto
  `profiles.id` with no mapping table — and what makes one subscription follow a learner from the
  browser to the phone.
- `useNativeEntitlement.ts` — what the app gates on: what Supabase says, OR what RevenueCat says.
  The synced `useEntitlement` reads `v_entitlement`, which resolves an institutional seat against a
  personal subscription in SQL, and stays authoritative. RevenueCat's own `customerInfo` is added
  on top because the phone has a gap the browser does not: a purchase can complete against a store
  the webhook has not been pointed at yet, and a buyer must not sit behind a paywall they have just
  paid to remove. It can only ever *add* access — RevenueCat knows nothing about institutional
  seats.

The pricing screen reads prices from the live offering and falls back to the synced billing config
when the SDK is unconfigured, unreachable, or still loading — the same three-state discipline the
web `PricingPage` keeps.

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

- **No splash screen.** `app.json` sets an icon and an Android adaptive-icon foreground but no
  splash; Expo's default is used. A branding decision, not a code one.
- **No tests.** The engines are covered by the web project's suite, but the hand-written native
  code — the loop hook, the presentation views, the adapters — is covered only by typecheck and
  lint. `jest-expo` is the obvious next step.
- **Diagram animation** (flow, liver arrows) is static, and there is no transport (play/pause/step).
