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

# Stock Ticker (optional)
# Primary: Yahoo Finance (uses crumb+cookie auth for batch v7 quote API)
# Fallback 1: Yahoo v8 chart API (no auth needed, parallel fetches)
# Fallback 2: Alpha Vantage (rate-limited, requires API key)
ALPHAVANTAGE_API_KEY=your-alpha-vantage-key  # Optional last-resort fallback
USE_PLACEHOLDER_STOCKS=true                   # Set to "true" to use hardcoded placeholder data
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