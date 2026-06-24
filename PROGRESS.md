# PROGRESS — EHRPlus Patient Portal redesign

Premium read-only patient portal, web + mobile, Clinical Slate design. Each feature
ships as an independent PR against `ehrplus/main` for review. See PRODUCT.md / DESIGN.md.

Legend: ✅ done · 🟡 in progress · ⬜ not started · 🔍 in review

## Foundation (PR #1: `redesign/foundation`) — 🔍 in review

- ✅ Clinical Slate Tamagui theme (palettes recolored)
- ✅ PRODUCT.md / DESIGN.md / PROGRESS.md
- ✅ DTO layer (`server/dto/`) + adapters (`server/adapters/`) + unit tests
- ✅ Security: JWT secret → env, read-only invariant documented + enforced
- ✅ Shared UI primitives (`components/ui/`): Screen, Section, Panel, Row, StatusPill, LabValueRow, Sparkline, Money, EmptyState, Skeleton, ErrorState, IdentityChip
- ✅ Responsive NavShell (mobile bottom tabs / web sidebar)

## Feature PRs (each branched off foundation) — all 🔍 in review

| Feature | Branch | PR | Status |
|---|---|---|---|
| Auth (login, verify, hospital select, QR) | `redesign/auth` | #7 | 🔍 |
| Home / overview dashboard | `redesign/home` | #4 | 🔍 |
| Visits (list + detail) | `redesign/visits` | #5 | 🔍 |
| Lab results (+ trends) | `redesign/labs` | #6 | 🔍 |
| Medications + prescriptions | `redesign/meds` | #3 | 🔍 |
| Billing + insurance (read-only) | `redesign/billing` | #8 | 🔍 |
| Profile + hospital info + i18n (EN/NE) | `redesign/profile` | #9 | 🔍 |
| Documents (PDF view/share) | `redesign/documents` | #2 | 🔍 |

## Integration notes (to resolve when merging)

- `server/routers/_app.ts` is touched by 6 PRs → expect merge conflicts (each adds/edits its own
  `.query`). Land foundation first, then merge features one by one.
- `redesign/profile` changes the `patient` query to return the `Patient` DTO and updates its
  consumers (`index.tsx`, `visits.tsx`). Home/visits on other branches still read the raw shape —
  reconcile the `patient` query shape during integration so every consumer uses the DTO.
- Runtime verification against a live hospital (read-only) + screenshots: pending an integration branch.

## Quality bar

Every feature: full component states, responsive (mobile + web), DTO-backed, read-only,
run through an adversarial `impeccable critique` pass, typechecked, and (where possible)
verified against a live hospital with screenshots attached to the PR.

## Data sources (for reference)

Odoo RPC (`res.partner`, `patient.visit`, `emr.lab_observations`, `emr.practitioner`,
`who_insurance/*` for billing), OpenMRS REST (orders/concepts), Bridge API
(`/summary/:patient/:visit`, `/reports/:visit`, `/api/snapshots/patients`).
