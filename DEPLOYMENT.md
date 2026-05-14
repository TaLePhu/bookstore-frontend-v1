# Frontend Deployment

## Required environment

Set this variable on the hosting platform before building:

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
```

Do not commit local `.env` files. Use `.env.example` as the template.

## Build settings

- Install command: `npm ci`
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `>=20.9.0`

## SPA routing

The project includes deploy rewrites for client-side routes:

- Vercel: `vercel.json`
- Netlify: `netlify.toml` and `public/_redirects`

After deploying the backend, also set its `CORS_ORIGIN` to this frontend domain.
