# design-sync notes — livreur-app

- **Source is an app, not a library.** No dist/.d.ts; `.design-sync/ds-entry.js` is the hand-written barrel the converter bundles (`cfg.entry`). Add/remove components there AND in `componentSrcMap`. All props are hand-written in `cfg.dtsPropsFor` (plain JSX — keep them in sync with component signatures).
- **CSS:** run `buildCmd` before every converter run. It compiles `.design-sync/ds.css` (Google Fonts `@import` + `src/index.css`) with `.design-sync/tailwind.ds.config.js` (app theme; content = src + `.design-sync/**`) into `.design-sync/.cache/ds.css` (= `cfg.cssEntry`, gitignored).
- **Fonts:** Inter + Poppins from Google Fonts at runtime (`runtimeFontPrefixes`), same as `index.html`.
- **Provider:** `.design-sync/DsProvider.jsx` = MemoryRouter (TopBar, AuthShell, StatCard `to`, MissionCard, MarketplaceCard use router hooks / Link) + `#modal-root` (BottomSheet portals into it, as `index.html` does). Children mount one tick later so `#modal-root` exists when BottomSheet looks it up.
- **Sheet previews** render inside a transformed frame that owns its own `#modal-root`, so the fixed overlay stays inside the card (`cardMode: single`).
- **Icons:** only the lucide icons `src/` imports are exported from ds-entry (snapshot 2026-10-02 — regenerate when the app adds icons).
- **AuthShell logo** (`src/assets/logo_transparent.png`) is inlined into the bundle as a data URL — fine, no asset upload needed.
- **Excluded:** BottomNav, AvailabilitySwitch, AbonnementBanner, RealtimeStatus, DevBypassBanner (Redux store), ProtectedRoute (routing), MapRoutePreview (leaflet map), ProofCaptureModal (geolocation).
- **Fixed in source (2026-10-02, user-approved):** `src/utils/countries.js` search regex used literal combining chars (U+0300-U+036F); a bundle served without a UTF-8 charset decodes them as Latin-1 and the whole `_ds_bundle.js` throws. Rewritten as backslash-u escapes (0300-036f).
- **Flags:** country flag emojis render as letter pairs ("CI") in headless Chromium on Windows (no flag-emoji font). Environment limitation; real devices show flags.
- **App finding (not fixed):** `FilePicker` and `CodeInput` use `border-danger-400` for `invalid`, but the theme's `danger` palette has no 400 shade, so the class never exists and the red border never shows. The FilePicker preview no longer passes `invalid`. Fix: add `danger.400` to tailwind.config.js or switch to `border-danger-500`.
- **Card modes:** every multi-example component uses `cardMode: column` (full-width rows) — the default grid clipped the mobile-width cards.

## Re-sync risks
- `cfg.dtsPropsFor` is hand-written from the JSX signatures (2026-10-02); prop changes in synced components drift the `.d.ts` silently until updated.
- MissionCard / MarketplaceCard previews encode the API shapes (`expedition.expediteur`, `statut_expedition`…) as of 2026-10-02.
- The compiled CSS only contains classes used by `src/` + previews; re-validate `conventions.md` against `_ds_bundle.css` when styling changes.
- Toolchain assumed: Node 24, tailwindcss 3.4 CLI, playwright 1.62.0 (pinned to cached chromium-1234).
