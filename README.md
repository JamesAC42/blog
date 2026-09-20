# blog

source code for the blog website  

## Development

1. Install deps: `npm install`
2. Set up `.env` with required variables:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=replace-with-a-long-random-string
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

3. Prisma setup:

```
npm run prisma:generate
npm run prisma:migrate
node --import tsx prisma/seed.ts
```

4. Run:

```
npm run dev
```

## Deploy

Production deployment is automated via GitHub Actions. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**Required secrets** (configure in GitHub repo settings → Secrets and variables → Actions):
- `VPS_SSH_KEY` — deploy-only SSH private key (ed25519 recommended)
- `VPS_HOST` — VPS IP address
- `VPS_USER` — SSH user
- `VPS_KNOWN_HOSTS` — reviewed `known_hosts` entry for the VPS

The workflow triggers on pushes to `main` or via manual dispatch. It pulls the latest code, runs `npm ci`, generates Prisma client, applies migrations, builds, restarts only the `blog` PM2 process, and verifies health.