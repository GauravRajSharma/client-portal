# Deltalab design spec (hard requirement)

Source of truth: the prototype `Deltalab Mobile.dc.html` (claude.ai/design project 40a5cf16).
Every screen must match this language. This file distills it for implementation. When in
doubt, match the prototype exactly. Supersedes the older Clinical Slate `DESIGN.md`.

## Fonts
- Body/UI: **IBM Plex Sans** (400/500/600/700). All numbers, codes, values, ranges, money: **IBM Plex Mono** (400/500/600).
- Loaded via `@expo-google-fonts/ibm-plex-sans` + `@expo-google-fonts/ibm-plex-mono` in `app/_layout.tsx` useFonts. Tamagui font family `body` = IBM Plex Sans, `mono` = IBM Plex Mono.

## Color tokens (light) — exact
```
app gradient bg: linear-gradient(162deg,#e3ecfb 0%,#eef2fc 45%,#f1ecfb 100%)
bg #eaf0fb · surface #ffffff · surface-2 #f2f6fc · surface-3 #e9eff7
border rgba(15,40,80,.12) · border-strong rgba(15,40,80,.2)
text #0c1e33 · text-2 #46566a · text-3 #7c8b9e
primary #0b4ea0 · primary-strong #083a78 · primary-soft #e5edf9 · on-primary #fff
accent #1b6fc2 · accent-soft #e7f0fb
green #1f9d6b / soft #e2f4ec · amber #c8860d / soft #fbf0d8 · red #d6453d / soft #fbe5e4
chart-grid #e6edf4 · ring rgba(11,78,160,.28)
shadow: 0 1px 2px rgba(16,36,61,.06),0 1px 3px rgba(16,36,61,.05)
shadow-lg: 0 12px 32px -8px rgba(16,36,61,.18),0 4px 10px rgba(16,36,61,.06)
```
Dark theme (secondary, from prototype):
```
app bg linear-gradient(162deg,#0a1a2e,#0d2034 48%,#141a2f) · bg #0a1626 · surface #11233a · surface-2 #16283e · surface-3 #1d3047
border rgba(255,255,255,.12) · text #e9f0f8 · text-2 #9cafc3 · text-3 #6a7f96
primary #5a9af0 · primary-soft #0f2c52 · on-primary #04203f · green #34c98a · amber #e0a836 · red #f0625a · chart-grid #1c3349
```
Lab status -> color: normal=green, low/high (out of range, non-critical)=amber, critical=red, info/selected=primary. Each has a soft bg variant for pills.

## Radii / shadow / spacing
- Radii: inputs/buttons 12-14, cards 14-18, big cards 18-20, pills 18-20/full, icon chips 10-11.
- Cards: `background surface, 1px border, radius 16-18, box-shadow shadow`. Section headers 14.5-15px/700.
- Screen content padding: 16px horizontal. Gaps 10-14 between cards, 18-22 between groups.

## Type scale
- Screen title (header) 21/700 (-.4 tracking). Page H2 20-23/700. Section h3 14.5-15/700.
- Body 13.5-14.5. Label 12.5/600 text-2. Caption 11-12 text-2/3.
- Metric value 23/700 mono. Detail hero value 50/700 mono (-2 tracking). Status pill 10-11/700 uppercase .3-.4 tracking.

## Core components (build in components/ui, replace old ones)
- **StatusPill**: inline-flex, soft bg, colored 5px dot + UPPERCASE label, colored text, radius 20, padding 2px 8px. Sizes sm/md.
- **MetricTile** (home 2x2): gradient surface->surface-2, border, radius 16, pad 14; top row = soft icon chip (34px, soft bg, color icon, inset highlight shadow) + colored status dot w/ soft ring; label 12.5/600 text-2; value 23/700 mono + small unit. Subtle 3D press (translateY/scale).
- **ResultRow** (results list): card surface, 1px border, **border-left 4px = status color** (the prototype intentionally uses a colored left edge here — follow it, it overrides the generic side-stripe ban for this design), radius 15, pad 14; name 15/600 + method 11.5 text-2; right: value 19/700 mono colored + status pill; below: **range bar** (track surface-3 h7 r6, green-soft normal zone with green 2px edges, colored 13px marker dot w/ surface ring) + "Normal {range}" / date row.
- **RangeBar**: as above; detail variant taller (h11) with amber-soft gradient track + green normal zone + 18px marker + lo/Normal zone/hi labels (mono).
- **LineChart** (react-native-svg): area chart. Normal zone = green-soft rect band between lo/hi Y with dashed green edges; area fill = primary @10%; line = primary stroke 2.4 round; dots = surface fill + status-color stroke 2.4. Axis labels IBM Plex Sans 11 text-3 (skip every other if >7 pts). See buildChart in prototype (lines ~820). Trend variant: y-grid lines (chart-grid) + mono y labels, primary normal-zone band @13%, range/type toggles, point tooltip.
- **Header**: 40px rounded-12 icon buttons (back/theme/cart/bell), title 21/700. Bell has red dot.
- **BottomNav**: surface @92% + blur(14), top border; 5 tabs (icon+10px label), active=primary; center FAB (54px primary circle, shadow-lg) for the primary add action. Home-indicator bar below.
- **Alert banner** (home): red-soft bg, red 30% border, radius 15; red icon chip + title/sub + chevron.
- **PatientMini**: surface card, gradient (primary->accent) avatar 50px rounded-14 with initials, name + blood·recordId.
- **AlphaGate**: overlay/badge for not-yet-available features: render the real designed screen but with a "Not available in alpha" lock state (badge top, dimmed content or a centered lock card). Reusable.

## Screens (match prototype structure)
- **Login**: centered logo tile (white, rounded 30, shadow-lg) + brand name + "Butwal · Estd." style line; "Welcome back"; the EMAIL/PASSWORD + Face/Touch/Passkey block is the FUTURE app-account flow -> render it but mark "Coming soon" (alpha-disabled). BELOW, prominent: our REAL working login = hospital select + MRN + 2FA + scan visit-ticket ("from hospital / sticker"). OTP screen styling reused for our verify step.
- **Home**: greeting (today + Hello, {first}); alert banner if out-of-range; patient mini; 2x2 metric tiles (key recent results); summary chips row (counts: total/normal/attention/etc); critical-trend chart card; recent results list (dot + name/dept·date + value/status).
- **Results**: search + dept chips (horiz scroll) + groups by dept -> ResultRow cards; empty state.
- **Detail**: dept/panel chips; hero card (50px mono value + status pill + RangeBar detail + lo/normal/hi); recommendation callout; reference-method section; historical trend chart; meta table.
- **Trends**: test picker (full-screen overlay, grouped) + numeric (LineChart + normal-zone toggle + year stepper + type[line/area/bar] + range[week/month/year/max] toggles + stats grid) or qualitative (latest + timeline of results).
- **Profile**: profile card (accent avatar + recordId + info grid); Appearance (theme + accent toggles); notifications toggles; "My Hospitals & Labs" link; sign out (red-soft).
- **Alpha-gated (designed, disabled)**: Book a test (catalog + cart), Cart (collection/slot/checkout), My Hospitals (connect hospital + cards), Add result (4-step wizard). Build the UI per prototype, gate with AlphaGate ("not available for alpha").

## Mapping to our real data (read-only MVP)
We keep all working features and our read-only/DTO/security rules (see [[project-client-portal-mvp]] memory, PRODUCT.md). Bottom nav: **Home · Results · Trends · Book(alpha) · Profile**, FAB = Add result(alpha). Our extra real sections (Visits, Medicines, Billing, Documents) surface from Home cards/links and Profile. Lab data already flows via tRPC DTOs (patientAllLabResults, patientLabResults, toLabTrends). Charts consume LabResult/LabTrend DTOs.

## Hard rules retained
Read-only (no mutations), DTO-backed, identity from token. Premium on web + mobile (mobile = this phone layout; web = wider, sidebar nav reusing the same components/tokens).
