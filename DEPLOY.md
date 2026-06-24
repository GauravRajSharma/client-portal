# Deploying the Client Portal (web)

The portal is an Expo Router app with `web.output: "server"` — a static client **plus**
Node API routes (tRPC, Better Auth, the PACS image proxy). It ships as one Docker image
that builds the web export and hosts it with `expo serve`.

> Node 24 is required at runtime — the accounts layer uses the `node:sqlite` built-in.

## One-time setup

```bash
cp deploy/portal.env.example deploy/portal.env
# then edit deploy/portal.env — generate secrets with: openssl rand -base64 48
```

`deploy/portal.env` (gitignored) holds:

| var | what | note |
|---|---|---|
| `BETTER_AUTH_URL` | public origin | `https://mobile.ehrnepal.com` |
| `PASSKEY_RP_ID` / `PASSKEY_ORIGIN` | WebAuthn binding | **must** equal the public origin or passkey login breaks |
| `JWT_SECRET` | signs per-hospital tokens | keep stable |
| `BETTER_AUTH_SECRET` | signs app sessions | keep stable, or everyone is logged out |
| `PORT` | host listen port | `8973` |

## Build, run, push

```bash
./scripts/deploy.sh up          # build image + (re)start the container locally
./scripts/deploy.sh build       # build only (tags :<git-sha> and :latest)
./scripts/deploy.sh push        # push to registry.ehrnepal.com/ehrplus/client-portal
./scripts/deploy.sh logs        # follow logs
./scripts/deploy.sh status      # container state + health probe
./scripts/deploy.sh stop        # stop & remove
```

## How it runs here

- Container runs with **`--network host`** so the API routes resolve `*.netbird.selfhosted`
  (the Odoo / OpenMRS / Bridge backends) exactly like the host does.
- It listens on **host port `8973`**. Point `mobile.ehrnepal.com` at this host:port via the
  gateway.
- `auth.db` (app accounts + passkeys) persists in the `ehrplus-portal-data` Docker volume
  at `/app/server/data`, so restarts and image updates keep accounts.

## Mobile (later)

Native builds (EAS) are not part of this image. The native app talks to
`EXPO_PUBLIC_API_ORIGIN` (default `https://mobile.ehrnepal.com`), so once the gateway is
live the same backend serves both web and mobile. For local device dev, set
`EXPO_PUBLIC_API_ORIGIN=http://<your-lan-ip>:8081` before `expo start`.
