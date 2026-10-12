# Built by .github/workflows/deploy-docker.yml and run on the sites server
# (see the hanbok repo's deploy/sites/). Posts and the about page are files in
# /srv/app/content, a volume; the database is Postgres (DATABASE_URL).
FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /srv/app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
WORKDIR /srv/app
COPY --from=build --chown=node:node /srv/app ./
RUN mkdir -p content .cache && chown node:node content .cache
USER node
EXPOSE 3000
# Apply any new database migrations, then serve.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node_modules/.bin/next start"]
