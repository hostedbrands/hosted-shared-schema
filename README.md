# @hostedbrands/shared-schema

**Single source of truth for the Hosted Stack shared database schema.**

Every Hosted Stack app (Reviews, Proof, Reach, Leads, Presence, and any future apps) connects to the same PostgreSQL database on Railway and imports its shared identity table definitions from this package. There is exactly one definition of `users`, `businesses`, `clients`, etc. across the entire stack — it lives here.

---

## Status

- **Current version:** `v2.0.0` (2026-05-03)
- **Built from:** the live production Railway database, column-for-column
- **Wired into:** Reviews, Proof, Reach, Leads, Presence (all `main` branches as of 2026-05-03)
- **Migration owner:** Hosted Reviews (`hostedbrands/hosted-reviews-app`)

`v1.0.0` (March 2026) is deprecated. It was never installed by any app.

---

## Shared tables (10)

| Table | Migration owner | Read by | Write by |
|---|---|---|---|
| `businesses` | Reviews | All apps | Reviews, Proof, Reach |
| `users` | Reviews | All apps | Reviews, Proof |
| `user_products` | Reviews | All apps | Proof (today); Reviews to follow |
| `clients` | Reviews | All apps | Reviews, Reach, Leads |
| `technicians` | Reviews | Reviews, Proof | Reviews, Proof |
| `review_requests` | Reviews | Reviews, Reach | Reviews |
| `feedback` | Reviews | Reviews, Proof | Reviews |
| `referrals` | Reviews | Reviews | Reviews |
| `business_referrals` | Reviews | Reviews | Reviews |
| `card_orders` | Reviews | Reviews | Reviews |

App-specific tables (`proof_*`, `leads_*`, `reach_*`, `presence_*`, `funnel_events`, `postcard_*`, `neighbor_addresses`) are **NOT** in this package. They live in their own app repos.

---

## Architecture

```
              @hostedbrands/shared-schema  (this package — the master blueprint)
                          │
        ┌─────────┬───────┼───────┬─────────┬──────────┐
        ▼         ▼       ▼       ▼         ▼          ▼
     Reviews    Proof   Leads   Reach   Presence   (future apps)
   (migrates)  (read)  (read)  (read)   (read)
```

- **Reviews** is the ONLY app that runs migrations against shared tables
- All other apps are READ-ONLY consumers of these table definitions
- App-specific tables are owned and migrated by their own app

---

## Binding rules (read this before changing anything)

### ✅ DO

- **Add new columns to existing shared tables here, then bump the version.**
  Example: adding `instagram_handle` to `businesses` →
  edit `src/tables.ts` → bump version → publish → consuming apps update their dependency → Reviews runs the migration.
- **Add new shared tables here** if more than one app needs the table. Use unprefixed names (e.g., `subscriptions`, not `reviews_subscriptions`).
- **Match the live database exactly.** If the column is `text` in the DB, define it as `text` here — not `varchar`, not `char`.
- **Bump the version** on every change. Use semver:
  - `2.x.x → 2.x.(x+1)` — column additions, doc-only changes
  - `2.x.x → 2.(x+1).0` — new shared tables, new exports
  - `2.x.x → 3.0.0` — breaking changes (column drops, type changes)

### ❌ DO NOT

- **Do NOT redefine any shared table in an app repo.** No `pgTable("businesses", ...)` outside this package. If you find one, delete it and import from `@hostedbrands/shared-schema` instead.
- **Do NOT create app-prefixed copies of shared tables** (e.g., no `proof_users`, no `leads_clients`). This was the original drift bug. The Proof identity accident (`proof_users` / `proof_businesses`) was caught and fixed on 2026-05-03.
- **Do NOT vendor this package** by copying the source files into an app's `shared/` directory. Always install via npm.
- **Do NOT run `drizzle-kit push` or `drizzle-kit migrate` from any app except Reviews** against shared tables. Only Reviews owns these migrations.
- **Do NOT change the database from `psql` directly** (no `ALTER TABLE`, no `DROP COLUMN`). All changes flow through the package → Reviews → migration.

---

## How consuming apps use this package

### Install

```json
{
  "dependencies": {
    "@hostedbrands/shared-schema": "github:hostedbrands/hosted-shared-schema#v2.0.0"
  }
}
```

Pin to a specific version tag, never `main`. This guarantees an upgrade is intentional.

### Required peer versions (must match across all apps)

```json
{
  "drizzle-orm": "^0.39.3",
  "drizzle-zod": "^0.7.0",
  "zod": "^3.24.2"
}
```

### Re-export pattern (in `app/shared/schema.ts`)

```ts
// Re-export shared tables from the package
export {
  users, businesses, userProducts, clients, technicians,
  reviewRequests, feedback, referrals, businessReferrals, cardOrders,
} from "@hostedbrands/shared-schema";

export type {
  User, Business, UserProduct, Client, Technician,
  ReviewRequest, Feedback, Referral, BusinessReferral, CardOrder,
  // ...InsertX types
} from "@hostedbrands/shared-schema";

// Define app-specific tables locally (e.g., proof_*, leads_*, etc.)
import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
export const myAppSpecificTable = pgTable("myapp_thing", { ... });
```

### Drizzle config in consuming apps

For apps that are NOT Reviews, ensure their `drizzle.config.ts` does NOT pick up shared tables for migrations. Use `tablesFilter`:

```ts
// Example: Presence's drizzle.config.ts
export default defineConfig({
  schema: "./shared/schema.ts",
  tablesFilter: ["presence_*"],   // Only migrate presence_ tables; ignore re-exports
  // ...
});
```

Reviews' config has NO `tablesFilter` because Reviews owns the shared-table migrations.

---

## Workflow: adding a column to a shared table

1. Open this repo (`hostedbrands/hosted-shared-schema`)
2. Add the column to the table definition in `src/tables.ts`
3. Bump version in `package.json` (e.g., `2.0.0 → 2.1.0`)
4. Update version reference in this README
5. Commit + push + tag the new version
6. **In each consuming app**, update `package.json` to point at the new tag, run `npm install`
7. **In Reviews specifically**, run `drizzle-kit generate` to produce the SQL migration
8. **Inspect the generated SQL** carefully — does it match what you intended?
9. Apply the migration: `drizzle-kit migrate` (or `drizzle-kit push` if you accept the journal-drift caveat below)
10. Verify the live DB by running: `\d <table_name>` in `psql`

---

## Known issues (as of 2026-05-03)

- **Reviews migration journal is incomplete.** The current `drizzle/0000_*.sql` file describes only the original tables; ~33 columns were added later via `drizzle-kit push` without producing migration files. This means running `drizzle-kit migrate` from a fresh checkout will error on existing columns. Use `drizzle-kit push` instead, OR reconcile the journal in a dedicated thread (not blocking).
- **`user_products` is not yet written by Reviews.** Today only Proof writes to it. Reviews and the other apps need to start writing access entitlements when a business buys/upgrades. Tracked in `hosted-stack/00-master/decisions-log.md`.
- **Brand color drift.** The `primary_color` default in this schema is `#0d9488` (matches live DB), but the canonical Hosted Brands brand color in `00-brand-system.md` is `#2AABB3`. Either the default should change, or the doc should change. Tracked in master folder.
- **Unprefixed legacy tables** still exist in the live DB: `funnel_events` (Reviews-specific), `postcard_templates` / `postcard_orders` / `neighbor_addresses` (Reach-specific), `lead_pages` / `lead_sources` / `lead_page_visits` / `leads` (also Reach-specific, predates Hosted Leads). These are all out of scope for this package (they belong to apps), but should be renamed with proper prefixes in a future coordinated cleanup.

---

## Version history

- **v2.0.0** (2026-05-03) — Rebuilt from live production DB. 150 columns across 10 tables. Wired into all 5 Hosted Stack apps. Replaces stale v1.0.0.
- **v1.0.0** (2026-03-27) — Initial draft. Never installed by any app. Deprecated.

---

## Thinking about an exit?

This package is the architectural backbone for selling Hosted Stack down the road. A buyer's due diligence will look at:

- "Is the schema documented and consistent across apps?" → ✅ yes, this package
- "Can a new engineer onboard without reading 5 different schema files?" → ✅ yes
- "Are there hidden drift bugs across the apps?" → ✅ no, the package enforces consistency
- "Is identity unified across apps for cross-sell / bundle behavior?" → ✅ yes, all apps read shared `users` and `businesses`

Keep this package healthy and you keep your exit option healthy.

---

## Repository

`hostedbrands/hosted-shared-schema` (private, owned by Hosted Brands)
