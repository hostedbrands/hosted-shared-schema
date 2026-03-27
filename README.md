# @hostedbrands/shared-schema

Shared database schema for all Hosted Brands apps (Reviews, Reach, Proof, Leads, Nudge).

## What this is

All Hosted Brands apps connect to the same PostgreSQL database on Railway. This package defines the shared tables that multiple apps read from and write to. Each app also has its own app-specific tables defined in its own repo.

## Shared tables

| Table | Primary Owner | Used By |
|-------|---------------|---------|
| `businesses` | Reviews | All apps |
| `users` | Reviews | All apps |
| `clients` | Reviews, Reach | Reviews, Reach, Leads, Nudge |
| `technicians` | Reviews | Reviews, Proof |
| `review_requests` | Reviews | Reviews, Reach, Proof |
| `user_products` | All (cross-app) | All apps |
| `feedback` | Reviews | Reviews, Proof |
| `referrals` | Reviews | Reviews |
| `business_referrals` | Reviews | Reviews |
| `card_orders` | Reviews | Reviews |

## How to use in your app

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
// Import shared tables (DO NOT redefine these)
import {
  businesses,
  users,
  clients,
  userProducts,
  type Business,
  type User,
  type Client,
} from "@hostedbrands/shared-schema";

// Your app-specific tables
export const myAppThings = pgTable("my_app_things", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  // ...
});

// Re-export shared tables so your storage.ts can import from one place
export { businesses, users, clients, userProducts };
export type { Business, User, Client };
```

### 3. Configure Drizzle Kit for migrations

Your `drizzle.config.ts` must ONLY point to your app-specific tables:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema-myapp-only.ts",  // NOT the full schema
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Create `schema-myapp-only.ts` with ONLY your app's new tables (no shared tables).

## Rules

1. **Only Hosted Reviews runs migrations on shared tables.** All other apps reference them but never modify their structure.
2. **When adding a column to a shared table**, update this package first, bump the version, then update Reviews and run `db:push`.
3. **Each app's `drizzle.config.ts`** must point to an app-specific schema file, not the full schema.
4. **Never hardcode the DATABASE_URL** — always use `process.env.DATABASE_URL`.
5. **All apps can READ and WRITE to shared tables** (e.g., Reach can create clients). Only the schema structure is managed by Reviews.

## Adding a new shared table

1. Add the table definition to `src/tables.ts`
2. Add types to `src/types.ts`
3. Export from `src/index.ts`
4. Push to main
5. Run `npm update @hostedbrands/shared-schema` in each app that needs it
6. Add the CREATE TABLE to Reviews and run `db:push`

## Architecture

```
Railway PostgreSQL (single instance)
├── Shared tables (defined here, migrated by Reviews)
│   ├── businesses
│   ├── users
│   ├── clients
│   ├── technicians
│   ├── review_requests
│   ├── user_products
│   ├── feedback
│   ├── referrals
│   ├── business_referrals
│   └── card_orders
│
├── Reviews-specific tables (hosted-reviews-app)
│   └── (none beyond shared — all Reviews tables are shared)
│
├── Reach-specific tables (hosted-reach-app)
│   ├── postcard_templates
│   ├── postcard_orders
│   ├── neighbor_addresses
│   └── reach_subscriptions
│
├── Proof-specific tables (hosted-proof-app)
│   ├── proof_photos
│   ├── proof_posts
│   ├── proof_post_captions
│   ├── proof_social_accounts
│   └── proof_subscriptions
│
├── Leads-specific tables (hosted-leads-app) — future
│
└── Nudge-specific tables (hosted-nudge-app) — future
```
