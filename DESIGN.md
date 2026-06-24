# DESIGN.md — EHRPlus Patient Portal

Design language: **Clinical Slate**. Light theme, cool slate-tinted neutrals, a single
deep indigo accent. Calm, precise, institutional without the healthcare-teal cliché.

## Theme

Light is the default and primary theme (used in daylight glare and dim clinics on
low-end screens; dark mode renders poorly there). A dark theme exists but is secondary.

## Color (implemented in `tamagui.config.ts` via theme-builder palettes)

Never `#000`/`#fff`; every neutral carries a faint slate chroma (hue ~222).

| Role            | Light value (intent)        | Token usage |
|-----------------|-----------------------------|-------------|
| App background  | `hsla(222,24%,99%)`         | `$background` (base theme) |
| Surface / card  | one step up from app bg     | `$color1`/`$color2` |
| Border          | mid-low palette             | `$borderColor`, `$color4`/`$color5` |
| Text ink        | `hsla(222,32%,11%)`         | `$color` (strong end) |
| Muted text      | mid palette                 | `$color9`/`$color10` |
| Accent (indigo) | `~#3B4B9A` `hsla(230,48%,42%)` | `accent` theme, `$accent*` |

Semantic sub-themes (full 1–12 scales, from `@tamagui/colors`): `success` (green),
`warning` (amber/yellow), `error` (red). Wrap a region in `<Theme name="success">` etc.
Lab severity maps: normal→neutral/success, low→accent (indigo/info), high→warning,
critical→error.

Color strategy: **Restrained**. Accent only for primary action, current selection,
focus, and status. No decorative color, no full-saturation on inactive states.

## Typography

System stack (`-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`) for native
feel on every platform. One family. Fixed scale, ratio ~1.2. Body 16px min (patients,
glare). Numbers (lab values, money) may use tabular alignment. Prose capped 65–75ch.

## Layout & responsive (structural, not fluid type)

- **Mobile**: bottom tab bar (Home, Visits, Results, Meds, More/Profile) + stacked screens.
- **Web / `$gtSm`**: persistent left sidebar nav + multi-column content, max content width
  ~860–1100px, denser tables. Same components, breakpoint-driven structure.
- Vary spacing for rhythm; avoid uniform padding. Cards only when truly the best
  affordance; never nest cards. Don't wrap everything in a container.

## Components (every interactive one ships all states)

default / hover / focus / active / disabled / loading / empty / error. Loading =
**skeletons**, not centered spinners. Empty states teach. Consistent vocabulary across
screens (same button, same status pill, same row).

Shared primitives live in `components/ui/` (built in foundation): Screen, AppHeader,
NavShell (sidebar+tabs), Section, StatusPill, LabValueRow (with range bar), Sparkline,
Money, DateText, IdentityChip, EmptyState, Skeleton, ErrorState, LanguageToggle.

## Motion

150–250ms, ease-out (quart/quint). Motion conveys state only (reveal, feedback,
loading). No page-load choreography, no bounce/elastic, never animate layout props.

## Absolute bans (enforced)

No side-stripe borders, no gradient text, no glassmorphism-by-default, no hero-metric
template, no identical-card grids, no modal-first. No em dashes in copy.

## Security (first-class, architectural)

- **Read-only invariant**: the tRPC router exposes only `.query` procedures for patient
  data (plus `signIn`/`verify` which authenticate, not mutate). No mutation procedures
  may be added. Never call backend write/admit/discharge/transfer endpoints.
- **Identity from token only**: the server derives the patient UUID from the verified
  JWT (`ctx.auth.uuid`); the `[uuid]` in the URL is cosmetic routing and is never
  trusted for data access.
- **Secret in env**: JWT signing key comes from `process.env.JWT_SECRET` (`server/config/env.ts`).
- Don't log PII. Backend basic-auth creds are still inline in `server/lib/clients.ts`
  (pre-existing) and tracked for env extraction.

## API decoupling (DTOs)

UI and tRPC procedures speak app-owned **DTOs** (`server/dto/`), never raw
Odoo/OpenMRS/Bridge shapes. Mapping lives in `server/adapters/`. Backend churn touches
only adapters.
