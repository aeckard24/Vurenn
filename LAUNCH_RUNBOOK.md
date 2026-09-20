# Vurenn launch and emergency runbook

Last updated: July 26, 2026

## Read this first

Production is intentionally left on the last known-working release until the
new database migration, Stripe catalog, backend, and frontend can be released
in that order. Do not deploy only half of the credit system.

Never paste secret keys into source code, GitHub, screenshots, tickets, or chat.
Secrets belong only in Railway/Supabase/Stripe environment settings. Rotate the
previously shared Stripe secret and webhook secret before a public launch.

## What the new release contains

- Free Top-off accounts start with 20 Vurenn credits.
- One-time packs: 50 credits for $12.99 and 100 for $23.99.
- Pro: $9.99/month or $99/year.
- Premier: $19.99/month or $199/year.
- Server-owned credit pricing and atomic, idempotent debit/grant ledgers.
- Usage costs shown beside models, voice, and future tools.
- Browser voice conversation mode (speech transcript in, spoken answer out).
- Transparent existing V mark and corrected favicon configuration.
- Name/work/goals/response-style onboarding saved to the user profile.
- Persistent Supabase sessions, email-code verification UI, and OAuth buttons.
- Real TOTP authenticator MFA. SMS is held until a paid SMS provider is chosen.
- Camera access is clearly labeled experimental and not a secure auth factor.

## Coordinated release order

1. In Supabase SQL Editor, select `Verenn-Launch`, paste and run the complete
   backend file `supabase/schema.sql`. It is repeatable and safe to rerun.
2. Confirm these tables exist: `profiles`, `credit_accounts`, `credit_ledger`,
   `credit_purchases`. Confirm every existing auth user has a credit account.
3. In Stripe **live mode**, create these products/prices:

   | Environment variable | Type | Exact value |
   | --- | --- | --- |
   | `STRIPE_PRO_MONTHLY_PRICE_ID` | recurring monthly | USD 9.99 |
   | `STRIPE_PRO_ANNUAL_PRICE_ID` | recurring yearly | USD 99.00 |
   | `STRIPE_PREMIER_MONTHLY_PRICE_ID` | recurring monthly | USD 19.99 |
   | `STRIPE_PREMIER_ANNUAL_PRICE_ID` | recurring yearly | USD 199.00 |
   | `STRIPE_CREDITS_50_PRICE_ID` | one-time | USD 12.99 |
   | `STRIPE_CREDITS_100_PRICE_ID` | one-time | USD 23.99 |

4. Copy only the six generated `price_...` IDs into the Railway **backend**
   service variables. Keep `STRIPE_PRICE_ID` pointed at Pro monthly temporarily
   for backwards compatibility.
5. Add `checkout.session.async_payment_succeeded` to the Stripe webhook at
   `https://api.vurenn.com/webhook`.
6. Deploy backend first. Verify:

   ```powershell
   Invoke-RestMethod https://api.vurenn.com/health
   Invoke-RestMethod https://api.vurenn.com/v1/usage-costs
   Invoke-RestMethod https://api.vurenn.com/v1/voice/config
   ```

7. Sign in with a test user and verify `/v1/credits` returns 20 credits. Send
   one Fast message and confirm the balance becomes 19 and one ledger row is
   created.
8. Deploy frontend. Test account creation, OTP entry, onboarding, TOTP setup,
   voice input, Pro/Premier checkout pages, and both credit-pack checkout pages.
   Do not complete a live charge unless a designated test purchase/refund has
   been approved.

## Supabase email and login work still requiring account setup

The app supports a 6-digit email-code UI. In Supabase:

1. Authentication → Email Templates → Confirm signup.
2. Brand the HTML as Vurenn and include `{{ .Token }}` visibly.
3. Use a custom SMTP provider before public launch. Supabase's default mailer is
   restricted and is not a production Vurenn sender.
4. Configure a sender such as `Vurenn <hello@vurenn.com>` after the domain is
   verified with the email provider.
5. Enable Google and GitHub under Authentication → Providers only after their
   OAuth client IDs/secrets are created. Callback URL:
   `https://fniokhkaugqmszerzffy.supabase.co/auth/v1/callback`.
6. Keep the site URL `https://vurenn.com` and redirect allow-list
   `https://vurenn.com/**`.

TOTP is free and supported now. SMS MFA is not free to operate: Supabase needs
a messaging provider, and the provider charges for delivery. Security questions
are intentionally excluded because they are guessable and unsafe.

## A sensible one-week launch schedule

### Day 1 — infrastructure

- Rotate exposed Stripe credentials.
- Run the Supabase migration.
- Create the six exact Stripe prices.
- Configure Railway backend variables.
- Confirm webhook events and signatures.

### Day 2 — auth and email

- Configure custom SMTP and DNS records.
- Apply the Vurenn confirmation template with `{{ .Token }}`.
- Create Google/GitHub OAuth apps and enable providers.
- Test signup, refresh, close/reopen browser, sign-out, reset password, and TOTP.

### Day 3 — payments and credits

- Use Stripe test mode in a staging Railway environment if possible.
- Test each subscription and one-time pack.
- Confirm duplicate webhooks do not duplicate credits.
- Confirm failed assistant responses refund the base credit.
- Confirm free users cannot spend below zero.

### Day 4 — product QA

- Test Chrome and Edge voice input; verify unsupported browsers show an honest
  message.
- Test mobile layout, sidebar Store position, balance badge, onboarding skip,
  long names, slow connections, and expired sessions.
- Check light/dark favicon and transparent logo on every surface.

### Day 5 — security and policy

- Add Terms, Privacy, billing/refund policy, and AI accuracy language.
- Confirm Stripe product descriptions match the UI exactly.
- Confirm camera unlock is never treated as real authentication.
- Review Supabase RLS and Railway variables with a second trusted person.

### Day 6 — soft launch

- Release to a small invited group.
- Watch Railway errors, Stripe events, Supabase auth logs, and Anthropic spend.
- Set spending alerts/limits with every paid provider.
- Record confusing language and failed paths; do not add unmetered features.

### Day 7 — public launch or hold

- Launch only if payments, refunds, webhook idempotency, auth email, and account
  recovery all passed.
- Otherwise hold production and fix the failing item. A delayed launch is safer
  than incorrect charges or locked-out users.

## Emergency editing on Windows

Frontend:

```powershell
cd <path-to-vurenn-frontend>
git status
git pull --ff-only
pnpm install
pnpm dev
```

Backend:

```powershell
cd <path-to-vurenn-backend>
git status
git pull --ff-only
python -m py_compile wsgi.py
```

Before committing:

```powershell
git diff
git diff --check
```

Frontend verification:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Make an emergency branch:

```powershell
git switch -c codex/emergency-fix
git add path\to\only-the-file-you-changed
git commit -m "fix: describe the emergency"
git push -u origin codex/emergency-fix
gh pr create --draft --fill
```

Do not use `git reset --hard`, force-push, or paste secrets into `.env` files
that might be committed.

## Emergency rollback

If the site breaks after a deploy:

1. Railway → service → Deployments.
2. Select the immediately previous successful deployment.
3. Redeploy/rollback that exact version.
4. Roll back frontend and backend independently based on which health check
   failed.
5. Do not delete database tables during rollback. The new tables are additive
   and can remain unused by the older backend.

If checkout prices look wrong, remove the six new backend price variables or
roll back the backend immediately. The API validates amount, currency, billing
interval, and active status before opening checkout, so mismatches should fail
closed rather than charge.

If credits duplicate, disable the affected Stripe webhook endpoint temporarily,
preserve the event IDs, and inspect `credit_ledger.idempotency_key` before making
manual adjustments.

If a secret leaks:

1. Revoke/rotate it at the provider immediately.
2. Replace it in Railway.
3. Redeploy the affected service.
4. Review provider logs from the time of exposure.
5. Never reuse the old value.

## Important architecture boundary

The frontend stays light: it uses native browser speech APIs and does not ship
audio/biometric ML models. The backend receives voice transcripts through the
normal authenticated chat endpoint and never claims to store or verify a face.
Future web search, file analysis, image generation, deep research, and data
analysis are visibly marked unavailable until real server implementations and
cost enforcement exist.

## CEO admin and construction-mode access

These features become active only after the Supabase migration and coordinated
backend/frontend deployment described above.

### Access roles

- CEO administrator: `aeckard41306@gmail.com`
- Construction bypass only:
  - `Kwright041510@outlook.com`
  - `aeckard41306@gmail.com`

Andrew can open the CEO dashboard and manage construction mode. Kendric can use
Vurenn during construction but cannot open CEO-only reporting or controls.

### CEO dashboard

1. Create/sign into Vurenn using exactly `aeckard41306@gmail.com`.
2. Visit `https://vurenn.com/admin/overview`.
3. The backend checks the authenticated Supabase email against
   `ADMIN_EMAILS`. Typing the URL without the correct account redirects home.
4. Use **Turn construction on** to close public access.
5. Use **Open to public** only after launch checks are complete.

The revenue cards report gross paid Stripe invoices, completed credit top-offs,
and the connected Stripe balance. Gross revenue is not accounting profit and
does not subtract refunds, disputes, Stripe fees, taxes, or transfers.

### Team entry while construction mode is on

1. Open `https://vurenn.com`.
2. The public sees the unique Vurenn Under Construction page.
3. Click/tap the Vurenn logo five times.
4. Enter team reveal code `2654`.
5. Select **Team sign in**.
6. Sign up or sign in with one of the three exact approved emails above.
7. After email confirmation, the approved account stays signed in through
   Supabase's persisted browser session and can use the normal workspace.

The click sequence and `2654` only reveal the sign-in route. They do not grant
access. The backend email allowlist is the actual security control, so exposing
the code cannot turn an unapproved visitor into a team member.

### If a team member is sent back to construction

- Confirm the spelling and capitalization-insensitive email matches the list.
- Confirm the account completed Supabase email verification.
- Sign out, clear only the Vurenn site session if necessary, then sign in again.
- Confirm Railway's backend variable `MAINTENANCE_BYPASS_EMAILS` contains all
  three comma-separated addresses.
- Confirm the backend deployment containing the maintenance endpoint is live.
