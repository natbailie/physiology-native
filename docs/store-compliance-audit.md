# Store compliance audit — Physiology (iOS + Android)

Audited 2026-09-29, iPad/test-count/CI rows refreshed 2026-09-30, from the code in `physiology-native` and `physiology-app`. Based on the rules as I know them; **I did not re-fetch Apple's or Google's current policy text**, so confirm wording against the live guidelines before submitting. This is an engineering review, not legal advice.

Legend: PASS · ACTION (you or code must change something) · CHECK (needs a human decision)

## Blockers before submission
| # | Item | Status |
|---|------|--------|
| 1 | `src/shared/legal/business.ts` still holds `{{LEGAL_NAME}}`, `{{CONTACT_EMAIL}}`, `{{PRIVACY_EMAIL}}`, `{{ICO_REGISTRATION_NUMBER}}`, etc. Apple 5.1.1 and Play both require a working support/privacy contact; a placeholder in the shipped legal pages is a rejection risk. Edit in **physiology-app**, then `npm run sync`. | ACTION |
| 2 | RevenueCat key is a **Test Store** key. Production needs the real iOS and Android SDK keys (`EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`), set as EAS environment variables, not committed. | ACTION |
| 3 | Privacy Policy URL and Terms URL must exist as public web pages for both store listings (the web app has them at `#privacy` / `#terms`; a hash route may not satisfy reviewers — give each a stable URL). | CHECK |
| 4 | Google Play requires an **account-deletion web link** in the Data Safety form in addition to in-app deletion. The web app has in-app deletion only; provide a public page explaining how to request deletion. | ACTION |

## Apple App Store
| Guideline | Finding | Status |
|---|---|---|
| 2.1 App completeness | Needs demo credentials in review notes because most modules are gated behind sign-in / subscription. | CHECK |
| 3.1.1 In-App Purchase | Subscriptions use RevenueCat → StoreKit. But `app/pricing.tsx` also offers **institutional licence-code redemption** (`redeem_licence`), and licences are sold to institutions via Stripe on the web. Apple permits access purchased elsewhere by an organisation (3.1.3(c) enterprise/multi-platform), provided the app does **not** link to or advertise external purchase. Confirm no screen tells iOS users to buy on the web. | CHECK |
| 3.1.2 Subscriptions | Auto-renew disclosure, price, Restore Purchases, Terms and Privacy links, and manage-subscription link are present on pricing. | PASS |
| 5.1.1(v) Account deletion | In-app two-step deletion → `delete_own_account`. Note it does not cancel store subscriptions; the copy warns about this. | PASS |
| 5.1.1 Data collection / privacy labels | `app.json` privacy manifest declares Email, UserID, PurchaseHistory, ProductInteraction, OtherUserContent (not tracking). The generated `ios/Physiology/PrivacyInfo.xcprivacy` is **stale** and empty — rerun `expo prebuild` before archiving so the shipped manifest matches. | ACTION |
| 5.1.2(i) Third-party AI data sharing | Tutor shows a consent sheet naming Mistral / Google and warns against patient data. | PASS |
| 1.2 User-generated content | Reviews are moderated before publishing and have a report link. Apple also expects a way to block abusive users and published contact info; blocking is absent (reviews are moderated, so likely acceptable — mention in review notes). | CHECK |
| 1.4.1 / 5.1.3 Medical / health | Educational-only disclaimers on catalogue, formulas, medications, and terms. Medications and formula pages are the most scrutinised: keep "not for dosing or clinical decisions" visible on those screens and state it in the review notes. Ensure no diagnosis or dose-recommending claims in store metadata. | CHECK |
| 4.8 Login services | Email/password only, no third-party social login, so Sign in with Apple is not required. | PASS |
| 5.1.1 Tracking | `NSPrivacyTracking` false, no ATT prompt, no analytics SDK in the native app. | PASS |
| 2.5.x Permissions | No `NS*UsageDescription` needed; none requested. | PASS |
| iPad | `supportsTablet: false` in `app.json` (iPad support was dropped), so no iPad screenshots or layout are required. The console listing must be iPhone-only. | PASS |
| Export compliance | `ITSAppUsesNonExemptEncryption: false` set. | PASS |

## Google Play
| Policy | Finding | Status |
|---|---|---|
| Data Safety form | Must declare email, user ID, purchase history, app interactions; data sent to Supabase, RevenueCat, and AI providers (Mistral, Google) for the tutor. Form must match the privacy notice. | ACTION |
| Target API level | No `targetSdk` is set; Expo's default tracks the SDK. Confirm the built AAB meets Play's current minimum target level. | CHECK |
| Payments | Digital subscriptions go through Play Billing via RevenueCat. Same external-purchase caution as Apple 3.1.1. | CHECK |
| Account deletion | In-app present; web deletion URL missing (blocker 4). | ACTION |
| Health / medical apps | Complete the Health apps declaration; keep the educational disclaimer. | CHECK |
| AI-generated content | Tutor labels answers as AI-generated and can be wrong. Play expects an in-app way to report offensive AI output; none exists. Add a "Report answer" link (mailto is acceptable). | ACTION |
| Permissions | None declared. | PASS |
| Families / target audience | Sign-up requires 18+; select an adult target audience (not children) in the console. | CHECK |
| Versioning | `appVersionSource: remote` with `autoIncrement` in production profile. | PASS |

## Secrets and security (task: no API keys in the app)
- **No model-provider or service secrets ship in either client.** Mistral/Gemini keys exist only as edge-function secrets (and a gitignored local `.env.local` for the web dev server). Enforced by web `secrets.test.ts` and new native `src/lib/secrets.test.ts`.
- Only public values are in the clients: Supabase URL + anon key (protected by RLS) and RevenueCat public SDK keys. These are designed to be public and cannot be "moved to a server".
- Supabase security advisors (run 2026-09-29): all tables have RLS. Findings: `billing_events` has RLS with no policy (intended: service-role only); four `SECURITY DEFINER` RPCs are callable by signed-in users (`create_cohort`, `delete_own_account`, `join_cohort`, `redeem_licence`) — intentional, each must validate `auth.uid()` internally; **leaked-password protection is disabled** — enable it in Supabase Auth settings (dashboard, I did not change it).
- Web CSP is `Report-Only`; enforce it once reports are clean.

## Not verified
- I could not run the native app on a simulator: `expo run:ios` failed at `pod install` (CocoaPods/Ruby environment problem on this machine). Native keyboard, safe-area and layout changes are therefore covered by typecheck, lint and unit tests only, not by screenshots on small/large iPhones, iPad or Android.
- The web app was checked at 320px wide in the browser pane (no horizontal overflow, viewport-fit, offline banner) but not with a real mobile keyboard.
