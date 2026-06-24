#!/usr/bin/env bash
# Build / push / run the EHRPlus Client Portal web container.
#
#   ./scripts/deploy.sh build [tag]     build the image (tag defaults to git short sha)
#   ./scripts/deploy.sh push  [tag]     push :tag and :latest to the registry
#   ./scripts/deploy.sh run             (re)start the container locally from :latest
#   ./scripts/deploy.sh up    [tag]     build + run (the common case)
#   ./scripts/deploy.sh logs            follow container logs
#   ./scripts/deploy.sh stop            stop & remove the container
#   ./scripts/deploy.sh status          show container + health
#
# Runs with host networking so the API routes can resolve *.netbird.selfhosted
# (the Odoo/OpenMRS/Bridge backends), exactly like the host does. The gateway
# (mobile.ehrnepal.com) should forward to this host on $PORT.
set -euo pipefail

cd "$(dirname "$0")/.."

REGISTRY="${REGISTRY:-registry.ehrnepal.com}"
IMAGE="${IMAGE:-$REGISTRY/ehrplus/client-portal}"
NAME="${NAME:-ehrplus-client-portal}"
VOLUME="${VOLUME:-ehrplus-portal-data}"
ENV_FILE="${ENV_FILE:-deploy/portal.env}"

git_tag() { git rev-parse --short HEAD 2>/dev/null || echo "latest"; }
PORT_FROM_ENV() { [ -f "$ENV_FILE" ] && grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 || true; }
PORT="${PORT:-$(PORT_FROM_ENV)}"; PORT="${PORT:-8973}"

require_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found. Copy deploy/portal.env.example -> $ENV_FILE and fill it in." >&2
    exit 1
  fi
}

cmd_build() {
  local tag="${1:-$(git_tag)}"
  echo ">> building $IMAGE:$tag"
  docker build -t "$IMAGE:$tag" -t "$IMAGE:latest" .
  echo ">> built $IMAGE:$tag (+ :latest)"
}

cmd_push() {
  local tag="${1:-$(git_tag)}"
  docker push "$IMAGE:$tag"
  docker push "$IMAGE:latest"
}

cmd_run() {
  require_env
  echo ">> (re)starting $NAME on host port $PORT"
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d \
    --name "$NAME" \
    --restart unless-stopped \
    --network host \
    --env-file "$ENV_FILE" \
    -e "PORT=$PORT" \
    -v "$VOLUME:/app/server/data" \
    "$IMAGE:latest"
  echo ">> $NAME is up — http://localhost:$PORT"
}

case "${1:-}" in
  build)  cmd_build "${2:-}";;
  push)   cmd_push  "${2:-}";;
  run)    cmd_run;;
  up)     cmd_build "${2:-}"; cmd_run;;
  logs)   docker logs -f "$NAME";;
  stop)   docker rm -f "$NAME";;
  status) docker ps --filter "name=$NAME"; echo; curl -fsS "http://localhost:$PORT" -o /dev/null -w "health: HTTP %{http_code}\n" || echo "health: unreachable";;
  *) echo "usage: $0 {build|push|run|up|logs|stop|status} [tag]"; exit 1;;
esac
