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