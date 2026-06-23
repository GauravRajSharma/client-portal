# PROGRESS — EHRPlus Patient Portal redesign

Premium read-only patient portal, web + mobile, Clinical Slate design. Each feature
ships as an independent PR against `ehrplus/main` for review. See PRODUCT.md / DESIGN.md.

Legend: ✅ done · 🟡 in progress · ⬜ not started · 🔍 in review

## Foundation (PR: `redesign/foundation`)

- 🟡 Clinical Slate Tamagui theme (palettes recolored)
- 🟡 PRODUCT.md / DESIGN.md / PROGRESS.md
- ⬜ DTO layer (`server/dto/`) + adapters (`server/adapters/`)
- ⬜ Security: JWT secret → env, read-only invariant documented + enforced
- ⬜ Shared UI primitives (`components/ui/`): Screen, AppHeader, StatusPill, LabValueRow, Sparkline, Money, EmptyState, Skeleton, ErrorState, IdentityChip
- ⬜ Responsive NavShell (mobile bottom tabs / web sidebar)

## Feature PRs (each branched off foundation)

| Feature | Branch | Status | Notes |
|---|---|---|---|
| Auth (login, verify, hospital select, QR) | `redesign/auth` | ⬜ | harden + restyle |
| Home / overview dashboard | `redesign/home` | ⬜ | at-a-glance: next visit, results needing attention, active meds, balance |
| Visits (list + detail) | `redesign/visits` | ⬜ | OPD/IPD/ER filter, drill-in |
| Lab results (+ trends) | `redesign/labs` | ⬜ | status-first, reference ranges, sparkline trend per analyte |
| Medications + prescriptions | `redesign/meds` | ⬜ | active meds, per-visit prescription |
| Billing + insurance (read-only) | `redesign/billing` | ⬜ | who_insurance addon; balance, itemized, NHIS coverage |
| Profile + hospital info + i18n (EN/NE) | `redesign/profile` | ⬜ | demographics, language toggle |
| Documents (PDF view/share) | `redesign/documents` | ⬜ | bridge summary/report PDFs |

## Quality bar

Every feature: full component states, responsive (mobile + web), DTO-backed, read-only,
run through an adversarial `impeccable critique` pass, typechecked, and (where possible)
verified against a live hospital with screenshots attached to the PR.

## Data sources (for reference)

Odoo RPC (`res.partner`, `patient.visit`, `emr.lab_observations`, `emr.practitioner`,
`who_insurance/*` for billing), OpenMRS REST (orders/concepts), Bridge API
(`/summary/:patient/:visit`, `/reports/:visit`, `/api/snapshots/patients`).
