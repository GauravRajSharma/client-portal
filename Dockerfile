# EHRPlus Client Portal — web server (Expo Router, web.output: "server").
#
# One stage: the runtime needs the Expo CLI + node_modules to host the export
# (`expo serve`), so a separate slim stage would save little. node:24 is required —
# the accounts layer uses the `node:sqlite` built-in (Node >= 22.5; pinned to 24).
FROM node:24-bookworm-slim
WORKDIR /app

# Install dependencies first for layer caching. .npmrc carries legacy-peer-deps=true.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# App source + production web export (client assets + server/API routes -> dist/).
COPY . .
RUN npx expo export -p web --output-dir dist

# auth.db (SQLite) lives here; mount a volume so accounts/passkeys survive restarts.
RUN mkdir -p server/data
VOLUME ["/app/server/data"]

ENV NODE_ENV=production
ENV PORT=8973
EXPOSE 8973

# Host the production export (serves static client + runs the API routes).
CMD ["sh", "-c", "npx expo serve dist --port ${PORT}"]
