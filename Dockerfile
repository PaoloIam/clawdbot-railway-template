# Build openclaw from source to avoid npm packaging gaps (some dist files are not shipped).
FROM node:22-bookworm AS openclaw-build

# Dependencies needed for openclaw build
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    curl \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Install Bun (openclaw build uses it)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /openclaw

# Pin to a known-good ref (tag/branch). Override in Railway template settings if needed.
# Using a released tag avoids build breakage when main temporarily references unpublished packages.
ARG OPENCLAW_GIT_REF=v2026.6.5
RUN echo "ref=${OPENCLAW_GIT_REF}" \
 && git clone --depth 1 --branch "${OPENCLAW_GIT_REF}" https://github.com/openclaw/openclaw.git . \
 && test "$(git describe --tags --exact-match)" = "${OPENCLAW_GIT_REF}" \
 && git rev-parse HEAD

# Patch: relax version requirements for packages that may reference unpublished versions.
# Apply to all extension package.json files to handle workspace protocol (workspace:*).
RUN set -eux; \
  find ./extensions -name 'package.json' -type f | while read -r f; do \
    sed -i -E 's/"openclaw"[[:space:]]*:[[:space:]]*">=[^"]+"/"openclaw": "*"/g' "$f"; \
    sed -i -E 's/"openclaw"[[:space:]]*:[[:space:]]*"workspace:[^"]+"/"openclaw": "*"/g' "$f"; \
  done

RUN pnpm install --no-frozen-lockfile
RUN pnpm build
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:install && pnpm ui:build


# Runtime image
FROM node:22-bookworm
ENV NODE_ENV=production

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    tini \
    gosu \
    python3 \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

# `openclaw update` expects pnpm. Provide it in the runtime image.
# Keep the corepack cache in a shared location so pnpm still resolves after the
# entrypoint drops privileges to the non-root user.
ENV COREPACK_HOME=/usr/local/share/corepack
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Persist user-installed tools by default by targeting the Railway volume.
# - npm global installs -> /data/npm
# - pnpm global installs -> /data/pnpm (binaries) + /data/pnpm-store (store)
ENV NPM_CONFIG_PREFIX=/data/npm
ENV NPM_CONFIG_CACHE=/data/npm-cache
ENV PNPM_HOME=/data/pnpm
ENV PNPM_STORE_DIR=/data/pnpm-store

# Claude Code CLI state (settings, OAuth credential cache) lives on the volume
# so it survives redeploys and is owned by the runtime user.
ENV CLAUDE_CONFIG_DIR=/data/.claude
ENV PATH="/usr/local/bin:/data/npm/bin:/data/pnpm:${PATH}"

WORKDIR /app

# Wrapper deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built openclaw (owned by the runtime user)
COPY --from=openclaw-build --chown=node:node /openclaw /openclaw

# Provide an openclaw executable
RUN printf '%s\n' '#!/usr/bin/env bash' 'exec node /openclaw/dist/entry.js "$@"' > /usr/local/bin/openclaw \
  && chmod +x /usr/local/bin/openclaw

COPY --chown=node:node src ./src

# The wrapper listens on $PORT.
# IMPORTANT: Do not set a default PORT here.
# Railway injects PORT at runtime and routes traffic to that port.
# If we force a different port, deployments can come up but the domain will route elsewhere.
EXPOSE 8080

# Start as root only to fix /data volume ownership, then drop to the non-root
# "node" user. Claude Code refuses --dangerously-skip-permissions as root, so
# the gateway and everything it spawns must not run as uid 0.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure PID 1 reaps zombies and forwards signals.
ENTRYPOINT ["tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
