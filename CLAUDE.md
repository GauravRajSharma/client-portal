# CLAUDE.md — ehrplus-client-portal

## "deploy this" = the full release pipeline

When the user says **"deploy this"** (or just "deploy"), it means run ALL of the following,
from the current state of `main`, not just one part:

### 1. Web → the client website
Build the web server image and redeploy the production container:
```bash
docker build -t ehrplus-portal-web:latest .
docker rm -f ehrplus-client-portal-ptr
docker run -d --name ehrplus-client-portal-ptr --restart unless-stopped --network host \
  --env-file deploy/portal.ptr.env -e PORT=8974 \
  -v ehrplus-portal-ptr-data:/app/server/data ehrplus-portal-web:latest
```
Caddy already fronts it at **https://client.ptr.kakeratech.com** → `127.0.0.1:8974`.
Verify `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8974` returns `200`.
(See DEPLOY.md for the container contract.)

### 2. Build the latest Android APK
```bash
docker build -f Dockerfile.apk -t ehrplus-portal-apk .
docker create --name apkx ehrplus-portal-apk
docker cp apkx:/app/android/app/build/outputs/apk/release/app-release.apk out/ehrplus-client-portal.apk
docker rm -f apkx
```
(arm64-v8a, EXPO_PUBLIC_API_ORIGIN baked to the production domain. No mmkv, no hack.)

### 3. Publish the APK to the copyparty CDN (always the latest build)
```bash
cp out/ehrplus-client-portal.apk /opt/cdn-data/files/apps/ehrplus-client-portal.apk   # private (login)
cp out/ehrplus-client-portal.apk /opt/cdn-data/files/pub/ehrplus-client-portal.apk    # public quick-share
```
Served at **https://cdn.ptr.kakeratech.com** (login: `share`/`gaurav`/`admin`) and
**/pub/** (anyone with the link). copyparty picks up the new file instantly.

Long Docker builds: run as a tracked background command (no inner `&`); the web image and
APK builds each take several minutes.
