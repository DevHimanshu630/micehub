# Deploy to Vercel

The app lives in `web/`. Vercel needs to know that (it's a monorepo-style layout).

## 1. Create the GitHub repo

1. Go to <https://github.com/new>
2. Repository name: `micehub` (or whatever you like — Vercel will derive the project name)
3. **Private** is fine (Vercel can deploy private repos on the free tier)
4. **Do NOT** initialise with README, .gitignore, or license — we already have those
5. Click **Create repository**
6. Copy the URL GitHub shows you (looks like `https://github.com/yourname/micehub.git`)

Then back here:

```sh
cd "/Users/himanshusingh/Desktop/MICE portal"
git remote add origin https://github.com/<yourname>/<reponame>.git
git push -u origin main
```

GitHub will prompt for credentials. Use a **Personal Access Token** as the
password (Settings → Developer settings → Personal access tokens → Tokens
(classic) → Generate new token with `repo` scope), not your GitHub password.

## 2. Create the Vercel project

1. Go to <https://vercel.com/new>
2. **Import** the GitHub repo you just pushed. If you haven't connected Vercel
   to GitHub before, it'll prompt to install the Vercel app on your account.
3. On the configure screen:
   - **Root Directory** → click *Edit* → select `web`
   - **Framework Preset** → Next.js (should auto-detect)
   - **Build Command** → leave default (`next build`)
   - **Output Directory** → leave default
4. **Environment Variables** — paste these from your local `web/.env.local`:

   | Name | Where to get it |
   |---|---|
   | `DATABASE_URL` | Neon dashboard → your project → Connection details |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys |
   | `CLERK_SECRET_KEY` | Clerk dashboard → API keys |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/post-auth` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/post-auth` |
   | `RAZORPAY_KEY_ID` | Razorpay dashboard → Settings → API keys |
   | `RAZORPAY_KEY_SECRET` | Same place |

   Fastest way: open `web/.env.local` and copy each value across.
5. Click **Deploy**.
6. Wait ~2 minutes. Vercel will give you a URL like
   `https://micehub-xyz.vercel.app`.

## 3. Post-deploy

### Clerk

Your Clerk publishable key starts with `pk_test_` (development mode). That
works in production — you'll just see a small "Development mode" banner.
Clerk allows any origin by default in development mode, so no whitelist needed.

When you're ready for real production:
- Clerk dashboard → switch to "Production" instance
- Get `pk_live_*` + `sk_live_*` keys
- Add the Vercel URL to **Allowed origins** in Clerk
- Update the two env vars in Vercel → Redeploy

### Razorpay

Your `rzp_test_*` key only accepts **test cards**. Use:
- Card: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits
- Name: anything

No real money moves. For real charges:
- Complete KYC in the Razorpay dashboard (1–3 business days)
- Get `rzp_live_*` + secret
- Update env vars in Vercel → Redeploy

### Neon

Your `DATABASE_URL` already points at a production-grade Neon Postgres. No
changes needed. If you want a separate prod/preview branch, see Neon → Branches.

## 4. Future deploys

Every `git push` to `main` triggers a redeploy. Open PRs get auto-generated
preview URLs. To redeploy manually: Vercel dashboard → Deployments → ⋯ → Redeploy.

## Common issues

- **Build fails with "Cannot find module '@/db'"** → root directory not set to
  `web` in Vercel project settings.
- **App loads but auth doesn't work** → missing one of the
  `NEXT_PUBLIC_CLERK_*` env vars (the public ones must be set at build time).
- **DB error "FATAL: too many connections"** → Neon free-tier connection limit
  hit; usually self-resolves in seconds. If persistent, upgrade Neon plan.
- **Razorpay returns "Authentication failed"** → key_id/secret mismatched;
  re-copy from the Razorpay dashboard.
