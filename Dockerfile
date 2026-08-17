FROM node:24-alpine AS base
# Prisma's query and schema engines link against OpenSSL.
RUN apk add --no-cache openssl

FROM base AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
# public/ is optional in git but the runner always copies it.
RUN mkdir -p public && npm run build

# The Prisma CLI applies migrations at startup. It is not part of the traced server
# bundle, so install it on its own at the version the lockfile pins.
FROM base AS cli
WORKDIR /cli
COPY package-lock.json ./
RUN VERSION="$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
    && rm package-lock.json \
    && npm init -y > /dev/null \
    && npm install --omit=dev --no-audit --no-fund "prisma@${VERSION}" \
    && npm cache clean --force \
    # The server bundle already carries the client; the CLI only needs the schema engine.
    && rm -rf /cli/node_modules/@prisma/client /cli/node_modules/.prisma

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/vocabulary.db
# Standalone output ships only the dependencies the server actually loads.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Schema and migrations, plus the CLI that applies them once per start.
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=cli --chown=node:node /cli/node_modules ./migrate-cli/node_modules
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["sh", "-c", "node migrate-cli/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma && node server.js"]
