# Naalak Ninjas Vault

> Four Friends. One Fund. Infinite Support.

A private emergency fund tracker for four people. Everyone pays in monthly, anyone
can request money from the pot in an emergency, the squad votes on it, and
repayments are tracked until the request is settled. Every action lands in a
shared activity log, so nobody has to take anyone's word for the numbers.

## Contents

- [Stack](#stack)
- [Getting started](#getting-started)
- [The squad](#the-squad)
- [How the vault works](#how-the-vault-works)
- [Project layout](#project-layout)
- [Database](#database)
- [Testing from a clean slate](#testing-from-a-clean-slate)
- [Known limitations](#known-limitations)

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 18 + Vite 5 |
| Routing | React Router 6 |
| Styling | Tailwind CSS 3, dark theme via CSS custom properties |
| Animation | Framer Motion |
| Icons | Lucide |
| Backend | Supabase (PostgreSQL) |

Plain JavaScript, no TypeScript. No Next.js.

## Getting started

You need Node 18+ and a Supabase project (the free tier is plenty).

```bash
npm install
```

Create the database. Open the SQL editor in your Supabase project, paste the
contents of `db/schema.sql`, and run it. It creates every table, view,
function, trigger and policy the app needs, seeds the four members and the
default business rules, and is safe to re-run.

Point the app at your project:

```bash
cp .env.example .env
```

Fill in `.env` from **Project Settings → API** in Supabase:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_SUPABASE_URL` must be the bare project URL. Do not append `/rest/v1/` —
the Supabase client adds that itself, and including it makes every query 404.

Then:

```bash
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## The squad

| Ninja | Accent |
| --- | --- |
| Shilpha | Emerald `#10B981` |
| Suhas | Crimson `#EF4444` |
| Sudeep | Azure `#3B82F6` |
| Aneesh | Gold `#F59E0B` |

There are **no default PINs**. The first time a ninja is picked the sign-in
screen asks them to choose a 4-digit PIN and confirm it; after that the same
screen asks them to enter it. A PIN can be changed later from Settings, which
requires the current one.

PINs are stored as bcrypt hashes in `members.pin_hash` and verified by
`verify_member_pin()` in the database, so one PIN follows a ninja to every
device and phone. The hash is never sent to the browser: the `anon` role has no
column privilege to read it, and `db/schema.sql` narrows the grant on `members`
to do that — which is why `dbService.getMembers()` names its columns instead of
selecting `*`.

Two consequences worth knowing. **Whoever sets a PIN first claims that ninja**,
since a first PIN needs nothing to prove against; tell the squad to set theirs
before sharing the URL. And **nothing recovers a forgotten PIN** — clear it with
`UPDATE members SET pin_hash = NULL WHERE name = '...'` in the Supabase SQL
editor, which returns that ninja to first-run setup.

Earlier versions shipped a starting PIN per ninja, which meant the values sat
in the source and therefore in the deployed bundle. A later version fixed that
but kept PINs in `localStorage`, which made them per-device: a ninja who had set
one on their phone was still offered first-run setup on a teammate's browser,
and that browser could set a different PIN for them. See
[Known limitations](#known-limitations) for what the PIN does and does not
protect.

The member ids in `src/contexts/AuthContext.jsx` match `members.id` in the
database. Don't renumber them.

## How the vault works

Every rule below is a row in `vault_settings` and is editable from the Settings
page. The defaults:

| Rule | Default | Meaning |
| --- | --- | --- |
| `monthly_contribution` | ₹5,000 | Each ninja's monthly target, so ₹20,000 a month for the squad |
| `minimum_balance` | ₹50,000 | Reserve that can never be withdrawn |
| `withdrawal_percentage` | 50% | Cap on a single request, as a share of the available balance |
| `required_approvals` | 3 | Approvals needed before money is released |
| `edit_window_hours` | 24 | How long a ninja may still edit or delete their own entry |
| `lock_period_months` | 3 | Months before withdrawals are allowed — **stored but not enforced**, see below |

**Balance.** The vault balance is total contributions, minus everything ever
disbursed, plus everything repaid. The available balance is the vault balance
less the reserve, floored at zero — so "available" already has the reserve
taken out, and the withdrawal cap applies to what's left.

**Requests.** A ninja opens a request for an amount and a reason. The amount is
capped at `withdrawal_percentage` of the available balance, checked both in the
form and by a database trigger.

**Voting.** The other three vote to approve or reject; you cannot vote on your
own request. At three approvals the request flips to approved and the money is
treated as disbursed. At two rejections approval is unreachable, so it flips to
rejected. Votes are final. Any ninja can share a pending request to WhatsApp to
nudge the others into voting.

**Corrections.** For `edit_window_hours` after making an entry, a ninja can edit
or delete their own contribution, and withdraw their own request while it is
still pending or rejected. After that the row is read-only for everyone — a
later mistake is fixed with a new entry rather than by rewriting history the
others have already reconciled. Both the buttons and a `BEFORE UPDATE OR DELETE`
trigger enforce this, so it holds even against a direct API call. An approved or
repaid request can never be deleted at all: it is part of the balance, and its
repayments would cascade away with it.

**Repayment.** Only the borrower can repay their own request, and never more
than they still owe. Once repayments cover the full amount the request becomes
repaid and the money is back in the pot.

## Project layout

```
db/
  schema.sql              Complete database schema — run this once
  reset-data.sql          Wipe transactional data, keep members and settings
docs/
  qa-test-suite/          Manual QA scripts
  PRODUCTION_QA_AUDIT_REPORT.md
public/images/            Ninja avatars and vault artwork
src/
  App.jsx                 Routes
  main.jsx                Entry point
  style.css               Theme tokens and the few custom classes that remain
  components/
    LayoutNew.jsx          App shell; picks sidebar or mobile chrome
    SidebarNew.jsx         Desktop navigation
    MobileHeader.jsx       Mobile top bar
    MobileBottomNav.jsx    Mobile tab bar
    ProfileSheet.jsx       Mobile profile sheet
    ProtectedRoute.jsx     Redirects to sign-in without a session
    ContributionForm.jsx   Forms render inside a <Modal>, they don't own one
    MissionForm.jsx
    RepaymentForm.jsx
    dashboard/             Dashboard panels
    ui/                    Design system, re-exported from ui/index.js
  contexts/
    AuthContext.jsx        Roster, PINs, session
  pages/
    NinjaSelection.jsx     Sign-in
    DashboardNew.jsx       "Vault"
    ContributionsNew.jsx   "Pay In"
    MissionsNew.jsx        "Emergency" — requests, voting and repayment
    SettingsNew.jsx        Business rules and PIN
  services/
    supabase.js            Every database call lives here
  utils/
    format.js              Money and number formatting (en-IN)
    ninjaHelpers.jsx       Per-ninja accent colours
    toast.js               Toast notifications
```

Navigation is deliberately three tabs plus Settings. Repayment lives inside
Emergency, and the activity feed lives on the dashboard; `/repayments` and
`/activity` redirect there for anyone with an old bookmark.

The `New` suffix on some filenames is historical — those are the live
components, and the originals are gone.

## Database

Seven tables:

| Table | Holds |
| --- | --- |
| `members` | The four ninjas. Reference data |
| `contributions` | Monthly pay-ins. Multiple rows per member per month are allowed |
| `missions` | Emergency requests: `pending` → `approved`/`rejected` → `repaid` |
| `votes` | One vote per member per mission |
| `repayments` | Payments against a mission |
| `activity` | Append-only audit log, written by triggers |
| `vault_settings` | The business rules above, as key/value rows |

One view backs a read path: `v_mission_summary`, which folds vote tallies and
repayment progress into each mission row so one row renders a card.

Two functions are called over RPC: `get_vault_balance()` and
`get_available_balance()`. `src/services/supabase.js` can compute both
client-side if they're missing, which keeps a half-configured project usable —
if you change the balance arithmetic, change it in both places.

Business rules are enforced by triggers, not just the UI: the withdrawal cap,
no self-voting, repayment authorisation and amount limits, automatic status
transitions, and activity logging for contributions (including deletions),
missions, votes and repayments.

## Testing from a clean slate

To take the app through a full cycle with no leftover data:

1. Run `db/reset-data.sql` in the Supabase SQL editor. It clears contributions,
   missions, votes, repayments and activity, and keeps the four members and
   your settings. Its first query prints what's about to be deleted, so you can
   run that part alone first if you want to look before you leap.
2. Clear your browser's `localStorage` for the site to drop the saved session,
   so you start from the sign-in screen. PINs live in the database now, so add
   `UPDATE members SET pin_hash = NULL;` to the reset if you want first-run
   setup back as well.
3. Reload the app. The dashboard should read ₹0 with an empty activity feed.

A reasonable path through the features: sign in, add a contribution for each
ninja, check the dashboard total and that "Pay In" shows everyone as paid, then
raise a request as one ninja, vote it through as the other three, and repay it
in two instalments to watch it settle. `docs/qa-test-suite/` has the detailed
scripts.

Note that with the default ₹50,000 reserve the available balance stays at ₹0
until contributions exceed the reserve, and requests are capped at 50% of that.
For a short test, lower `minimum_balance` in Settings first, or the request form
will refuse every amount.

## Known limitations

**There is no real authentication.** Every browser talks to Supabase with the
same public anon key, and identity is a 4-digit PIN. So:

- The PIN gates the UI, not the data. Anyone who can reach the project's API
  can read and write it directly.
- Row Level Security is enabled but the policies are permissive by design. A
  PIN check produces no database session, so Postgres still has no way to tell
  one ninja from another on the next request, and ownership rules are enforced
  by triggers and the UI instead. `db/schema.sql` explains this in full and
  documents why an earlier attempt at strict policies broke the app.
- Four digits is a 10,000-value space, so anyone holding the anon key can grind
  `verify_member_pin()`. bcrypt makes that slow rather than impossible.

This is an acceptable trade for four friends sharing a private URL. It is not
acceptable for anything wider. Fixing it properly means adopting Supabase Auth
and rewriting the policies against `auth.uid()`.

**`lock_period_months` does nothing yet.** The Settings page saves it, but no
code or trigger reads it, so withdrawals are not actually blocked during the
lock period. Every other rule in the table above is enforced in both the form
and the database.

**Other things worth knowing:** the production bundle is a single ~644 kB chunk
(~187 kB gzipped) with no code splitting.
