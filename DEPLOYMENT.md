# deployment

## prerequisites

1. install the vercel cli globally:
   ```bash
   npm install -g vercel
   ```

2. log in to vercel:
   ```bash
   vercel login
   ```

## first-time setup

link your local project to a vercel project (run once):

```bash
vercel link
```

follow the prompts to connect to your vercel account and create/link a project.

## deploy to production

```bash
npm run deploy
```

or directly:

```bash
vercel --prod
```

## deploy a preview

```bash
npm run deploy:preview
```

or directly:

```bash
vercel
```

## build locally first

to verify the build is clean before deploying:

```bash
npm run build
npm run preview
```

## environment variables

no environment variables are required for this project. if you add any in the future, set them via:

```bash
vercel env add MY_VAR
```

or through the vercel dashboard at https://vercel.com/dashboard.

## notes

- `vercel.json` includes a catch-all SPA rewrite so all routes serve `index.html`
- the app is fully client-side; no serverless functions are used
