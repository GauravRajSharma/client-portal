# MIGRATION_OFF_TAMAGUI.md

Replace **Tamagui** with **gluestack-ui v5 + NativeWind v5 (Tailwind CSS v4)**.

**Why:** the recurring native crash class ("Missing theme" on release builds) comes from
Tamagui's framework-level theme init. gluestack v5 is copy-paste components compiled by
NativeWind to plain RN styles — the component code lives in *this* repo, no opaque provider
to fail silently on a release build. We stay on Expo; only the styling layer changes.

**Cost, stated honestly:** this is **not** an import swap. Tamagui styles via props
(`gap="$2"`), gluestack/NativeWind styles via `className`. Every styled element gets a
one-time rewrite. Scope below is real.

---

## Scope (measured, not estimated)

- **44 files** import `tamagui` / `@tamagui/*` (full list in "Task 4" + "Task 3").
- **Used surface is small** — only these need a gluestack/NativeWind equivalent:
  | Tamagui | Replacement |
  |---|---|
  | `XStack` | gluestack `HStack` |
  | `YStack` | gluestack `VStack` |
  | `Text` | gluestack `Text` |
  | `ScrollView` | gluestack `ScrollView` (or RN `ScrollView`) |
  | `styled()` | NativeWind `className` + `tva` variants |
  | `<Theme>` / `useTheme` | Tailwind dark-mode class + `useColorScheme` |
  | `useMedia` | Tailwind responsive prefixes (`sm:` `md:` `lg:`) |
  | `@tamagui/lucide-icons` | `lucide-react-native` |
- **Config touchpoints to remove:** `babel.config.js` (`@tamagui/babel-plugin`),
  `metro.config.js` (`withTamagui`), `app/_layout.tsx` (`TamaguiProvider`, `PortalProvider`,
  `import "../tamagui-web.css"`), plus files `tamagui.config.ts` and `tamagui-web.css`.

---

## Strategy: coexist, migrate, then rip out

NativeWind and Tamagui **can run side by side** (both are just style systems). So:

1. Add gluestack/NativeWind **alongside** Tamagui (Tasks 0–2). App keeps working.
2. Migrate **primitives first** (`components/ui/*`) — most screens flow through them, so this
   does the heavy lifting (Task 3).
3. Migrate screens in batches, Tamagui still installed (Task 4).
4. Only when `grep -rE "from ['\"](tamagui|@tamagui/)"` returns **zero** do you rip Tamagui
   out (Task 6). This keeps `main` shippable at every step — do it on `redesign/off-tamagui`.

---

## Token map (port these to Tailwind)

The current Deltalab named tokens live in `tamagui.config.ts` (light ~L75–95, dark ~L110–130).
Lift them verbatim into the Tailwind theme (`tailwind.config.js` / `global.css` `@theme`):

| Tamagui token | Light | Dark | Tailwind name |
|---|---|---|---|
| `$primary` | `#0b4ea0` | `#5a9af0` | `--color-primary` |
| `$primaryStrong` | `#083a78` | `#7fb2f5` | `--color-primary-strong` |
| `$primarySoft` | `#e5edf9` | `#0f2c52` | `--color-primary-soft` |
| `$surface`, `$text2`, `$background`, `$borderColor`, … | *(copy from config)* | | `--color-surface`, etc. |

> Also lift the **tightened space scale** (config ~L313–320 shrinks every space token). Set
> Tailwind spacing so `gap="$2"`→`gap-2` etc. resolve to the same px you use today.

---

## Prop → className cheat sheet (the working reference)

| Tamagui prop | className |
|---|---|
| `f={1}` / `flex={1}` | `flex-1` |
| `ai="center"` | `items-center` |
| `jc="space-between"` | `justify-between` |
| `gap="$2"` | `gap-2` |
| `p="$3"` / `px`/`py` | `p-3` / `px-3` / `py-3` |
| `m="$3"` / `mx`/`my` | `m-3` / `mx-3` / `my-3` |
| `bg="$surface"` | `bg-surface` |
| `br="$4"` / `borderRadius` | `rounded-lg` (map scale) |
| `bw={1}` `boc="$borderColor"` | `border border-borderColor` |
| `w="100%"` / `maxWidth={640}` | `w-full` / `max-w-[640px]` |
| `fontSize="$5"` `fow="600"` `col="$text2"` | `text-lg font-semibold text-text2` |
| `<Theme name="dark">` | wrap under `dark` class / `useColorScheme` |
| `$sm={{...}}` / `useMedia().sm` | `sm:` prefix |

`styled(View, {...variants})` → define with `tva({ base, variants })` from
`@gluestack-ui/utils` (or plain `cva`) and spread `className={tva(props)}`.

---

# Task breakdown

> Each task: **files** it touches · **do** · **done when**. Check off in order.

## Task 0 — Branch + install (coexist)
- [ ] Files: `package.json`, `babel.config.js`, `metro.config.js`, `global.css` (new), `nativewind-env.d.ts` (new)
- [ ] Do: `git checkout -b redesign/off-tamagui`. Init gluestack v5 CLI
  (`npx gluestack-ui@alpha init`), choose **NativeWind** engine, Expo target. Add NativeWind's
  babel preset **without removing** `@tamagui/babel-plugin` yet. Add NativeWind's metro
  wrapper *inside* the existing `withTamagui(...)` for now.
- [ ] Done when: `expo start` boots web + native with both style systems present, no visual change.

## Task 1 — Port design tokens to Tailwind
- [ ] Files: `tailwind.config.js`, `global.css`, (read-only) `tamagui.config.ts`
- [ ] Do: copy every Deltalab color token (light + dark) and the tightened space scale into the
  Tailwind theme per the token map above. Set dark mode to `class`.
- [ ] Done when: a throwaway `<Box className="bg-primary p-3">` renders the exact brand blue and
  spacing on web + native, light and dark.

## Task 2 — Add the gluestack components you'll actually use
- [ ] Files: `components/ui/gluestack/*` (CLI output)
- [ ] Do: `npx gluestack-ui@alpha add hstack vstack text scrollview box` — that's the layout core.
  Add `button input toast` only if/when a screen needs them. **Don't** bulk-add all 30+.
- [ ] Done when: the added components import and render in isolation.

## Task 3 — Migrate the shared primitives (highest leverage)
These wrap Tamagui and back most screens. Migrate them and screens mostly follow.
- [ ] Files (14): `components/ui/primitives.tsx`, `care.tsx`, `dl.tsx`, `identity.tsx`, `lab.tsx`,
  `language.tsx`, `LineChart.tsx`, `NavShell.tsx`, `Pii.tsx`, `status.tsx`, and any other
  `components/ui/*` importing tamagui.
- [ ] Do: replace `XStack/YStack/Text/ScrollView` with gluestack equivalents; convert every
  styled prop to `className` per the cheat sheet; rewrite `styled(...)` as `tva`; replace
  `useMedia` in `NavShell` (mobile tabs vs web sidebar) with `sm:`/`lg:` classes or
  `useWindowDimensions`.
- [ ] Done when: `Screen/Section/Panel/Row/StatusPill/LabValueRow/Sparkline/IdentityChip` render
  identically on web + native; no `tamagui` import remains under `components/ui/`.

## Task 4 — Migrate auth + shell + screens (batched)
Keep Tamagui installed; go file by file. Suggested batches:
- [ ] **Shell/auth (6):** `app/_layout.tsx` (leave provider removal for Task 6), `components/protected.tsx`,
  `components/biometric-lock.tsx`, `components/security-settings.tsx`, `components/auth/{sign-in,scan,input,layout}.tsx`
- [ ] **Auth routes (4):** `app/auth/{login,verify,hospital,hospitals}.tsx`
- [ ] **Patient core (6):** `app/patient/[uuid]/{home,profile,visits,results,meds,billing}.tsx`
- [ ] **Patient rest (10):** `app/patient/[uuid]/{add,book,care,documents,hospitals,imaging,insurance,passport,reports}.tsx`,
  `.../results/[analyte].tsx`, `.../imaging/[order].tsx`, `.../[visit]/{index,lab,prescriptions}.tsx`
- [ ] **Misc (2):** `app/index.tsx`, `app/explore.tsx`
- [ ] Do per file: swap imports → gluestack; props → className; verify the screen on web + native.
- [ ] Done when: `grep -rE "from ['\"](tamagui|@tamagui/)" app components` returns **0** (except icons, Task 5).

## Task 5 — Swap icons
- [ ] Files: everything importing `@tamagui/lucide-icons` (~`components/ui/*`, `components/auth/input.tsx`)
- [ ] Do: `yarn add lucide-react-native`, replace import source. Icon names are identical.
- [ ] Done when: no `@tamagui/lucide-icons` import remains; icons render.

## Task 6 — Rip out Tamagui
- [ ] Files: `app/_layout.tsx`, `babel.config.js`, `metro.config.js`, `package.json`; delete
  `tamagui.config.ts`, `tamagui-web.css`, `.tamagui/`
- [ ] Do: remove `TamaguiProvider`/`PortalProvider` and `import "../tamagui-web.css"` from
  `_layout.tsx`; drop `@tamagui/babel-plugin`; unwrap `withTamagui` in metro (keep NativeWind's
  wrapper + `isCSSEnabled`); `yarn remove tamagui @tamagui/*`.
- [ ] Done when: `grep -rE "tamagui" .` (excluding `node_modules`, this doc) is clean; app boots.

## Task 7 — Verify (the whole point)
- [ ] Do: `yarn tsc --noEmit` clean · web build (`docker build -t ehrplus-portal-web:latest .`) ·
  **release APK** (`Dockerfile.apk`) installs and opens **without the Missing-theme crash** ·
  re-shoot the 6 screenshots (`01-login-mobile.png` … `06-login-web.png`) and eyeball parity.
- [ ] Done when: typecheck green, both images build, APK launches clean on device, screenshots match.

---

## Rollback

Everything is on `redesign/off-tamagui`; `main` stays on Tamagui until Task 7 passes. If gluestack
underperforms, the branch is discardable — no `main` commits until verified.

## Risks / watch-list

- **`styled()` call sites** — the only non-mechanical rewrites (→ `tva`). Grep them first.
- **`useMedia` in `NavShell`** — responsive shell is the trickiest single conversion.
- **`PortalProvider`** — toasts/overlays used it; gluestack has its own overlay host — wire it in
  `_layout.tsx` when you remove Portal.
- **Web CSS extraction** — keep Metro `isCSSEnabled: true`; NativeWind emits its own CSS, drop
  `tamagui-web.css` only in Task 6.
