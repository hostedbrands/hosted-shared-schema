# @hostedbrands/shared-schema

Single source of truth for the Hosted Stack shared database schema. All Hosted Stack apps (Reviews, Proof, Reach, Leads, Presence, Nudge) connect to the same PostgreSQL database on Railway and import these table definitions from this package.

**Version 2.0.0 — rebuilt 2026-05-03 from live production database.** All columns, defaults, and nullability match what is actually running. v1.0.0 (March 2026) is deprecated and was never wired up by any app.

## Shared tables

| Table | Migration owner | Read by | Write by |
|---|---|---|---|
| `businesses` | Reviews | All apps | Reviews, Proof, Reach |
| `users` | Reviews | All apps | Reviews, Proof |
| `user_products` | Reviews | All apps | Proof (today). Reviews & others to follow. |
| `clients` | Reviews | All apps | Reviews, Reach, Leads |
| `technicians` | Reviews | Reviews, Proof | Reviews, Proof |
| `review_requests` | Reviews | Reviews, Reach | Reviews |
| `feedback` | Reviews | Reviews, Proof | Reviews |
| `referrals` | Reviews | Reviews | Reviews |
| `business_referrals` | Reviews | Reviews | Reviews |
| `card_orders` | Reviews | Reviews | Reviews |

## How to use this package in an app

### 1. Install as a git dependency

In your app's `package.json`:

```json
{
  "dependencies": {
    "@hostedbrands/shared-schema": "github:hostedbrands/hosted-shared-schema"
  }
}
```

Then `npm install`.

### 2. Import shared tables in your schema

In your app's `shared/schema.ts`:

```typescript
import {
  businesses,
  users,
  userProducts,
  clients,
  technicians,
  type Business,
  type User,
  type Client,
} from "@hostedbrands/shared-schema";

// App-specific tables (must be prefixed with your app slug)
export const myappThings = pgTable("myapp_things", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  // ...
});

// Re-export shared tables so your storage.ts has one import point
export { businesses, users, userProducts, clients, technicians };
export type { Business, User, Client };
```

### 3. Drizzle Kit must NOT migrate shared tables

Your app's `drizzle.config.ts` must point at an app-specific-only schema file:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema-myapp-only.ts",  // NOT the full schema
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

`schema-myapp-only.ts` exports only your app-prefixed tables. Reviews is the only app whose drizzle config covers shared tables.

## Rules — binding for all Hosted Stack apps

1. **Only Hosted Reviews runs migrations on shared tables.** No other app may run `db:push`, `drizzle-kit migrate`, or any DDL on the tables defined in this package.
2. **All apps may READ and WRITE rows** in shared tables. The migration restriction is about table structure (columns, indexes), not row-level operations.
3. **App-specific tables MUST be prefixed** with the app slug: `proof_*`, `reach_*`, `leads_*`, `presence_*`. Defined in each app's own repo, not here.
4. **`DATABASE_URL` is always env-var driven.** Never hardcoded.
5. **One database, one migration owner.** This package does not manage multi-database setups. Hosted Faith apps have their own separate databases and do not use this package.

## Adding or changing a shared column

```
1. Edit src/tables.ts                          (this repo)
2. Bump version in package.json                (this repo)
3. Commit + push to main                       (this repo)
4. In each consuming app:
     npm update @hostedbrands/shared-schema
5. Reviews runs db:push LAST                   (only Reviews)
```

If the change is breaking (column removal, type change, rename), bump the major version and coordinate the rollout across apps.

## Architecture overview

```
Railway PostgreSQL (single shared instance for Hosted Stack)
│
├── Shared tables (this package, migrated by Reviews)
│   ├── businesses
│   ├── users
│   ├── user_products
│   ├── clients
│   ├── technicians
│   ├── review_requests
│   ├── feedback
│   ├── referrals
│   ├── business_referrals
│   └── card_orders
│
├── Reviews app-specific (hostedbrands/hosted-reviews-app)
│   └── funnel_events             (predates the prefix rule; left unprefixed)
│
├── Proof app-specific (hostedbrands/hosted-proof-app)
│   ├── proof_photos
│   ├── proof_posts
│   ├── proof_post_captions
│   ├── proof_social_accounts
│   ├── proof_subscriptions
│   ├── proof_tech_pins
│   ├── proof_businesses          (DEPRECATED — see known issues)
│   └── proof_users               (DEPRECATED — see known issues)
│
├── Reach app-specific (hostedbrands/hosted-reach-app)
│   ├── postcard_templates        (predates prefix rule)
│   ├── postcard_orders           (predates prefix rule)
│   ├── neighbor_addresses        (predates prefix rule)
│   ├── reach_subscriptions
│   └── reach_client_dismissals
│
├── Leads app-specific (hostedbrands/hosted-leads-app)
│   ├── lead_pages, lead_sources, lead_page_visits, leads
│   ├── leads_activities, leads_form_configs, leads_landing_pages
│   ├── leads_leads, leads_partial_leads, leads_sequences
│
└── Presence app-specific (hostedbrands/hosted-presence-app)
    ├── presence_preview_cache
    ├── presence_preview_leads
    └── presence_generation_log
```

## Known issues to fix later

These are documented here so they aren't lost; fixes are scoped to separate threads.

- **Proof identity drift.** Proof has its own `proof_businesses` and `proof_users` tables from an earlier accident. Long-term plan: migrate Proof to use shared `businesses` and `users`. Until then, a Top Care user in Reviews is NOT the same row as a Top Care user in Proof.
- **Reviews does not write `user_products`.** Reviews' `/api/auth/register` creates a row in `users` but does not create a `user_products` row. Only Proof writes `user_products` today. When SSO/bundle work happens, Reviews must be updated.
- **Unprefixed app-specific tables.** `funnel_events` (Reviews), `postcard_templates` / `postcard_orders` / `neighbor_addresses` (Reach) all predate the prefix rule. Renaming requires a coordinated migration; defer until a planned cleanup.
- **No Stripe.** Trial fields (`trial_ends_at`, `status`) exist on `user_products` and `businesses` but no app charges money yet.
