/**
 * HOSTED BRANDS — Shared Database Tables
 *
 * These tables are shared across ALL Hosted Stack apps and live in the
 * SAME PostgreSQL database on Railway. App-specific tables are defined
 * inside each app's repo and MUST be prefixed (proof_, reach_, leads_,
 * presence_).
 *
 * RULES (binding):
 *   1. ONLY Hosted Reviews runs migrations on these shared tables.
 *      No other app may run `db:push` against the shared schema.
 *   2. To add or change a column on a shared table:
 *        a. Edit this file. Bump version in package.json.
 *        b. Update each consuming app via `npm update @hostedbrands/shared-schema`.
 *        c. Reviews runs the migration LAST.
 *   3. Other apps may READ and WRITE to these tables, but never DDL them.
 *   4. App-specific tables go in each app's own repo, prefixed.
 *
 * GROUND TRUTH:
 *   This file is rebuilt from the live Railway production database
 *   on 2026-05-03. All columns, defaults, and nullability match
 *   what is actually running in production today.
 */

import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

// ============================================================
// BUSINESSES — Core business entity across all apps
// ============================================================
// Touched by: Reviews (owner), Reach (read), Leads (read),
//             Presence (read planned), Proof (read — currently
//             also has its own proof_businesses, see master doc)
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),

  // Review platform URLs (Reviews)
  googleReviewUrl: text("google_review_url"),
  facebookReviewUrl: text("facebook_review_url"),
  yelpReviewUrl: text("yelp_review_url"),

  // Brand assets (shared)
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0d9488"),

  // Lifecycle
  status: text("status").default("active"),
  createdAt: text("created_at"),

  // Reviews messaging templates
  thankYouMessage: text("thank_you_message"),
  smsTemplate: text("sms_template"),
  reminderTemplate: text("reminder_template"),
  thankYouSmsTemplate: text("thank_you_sms_template"),
  returningCustomerMessage: text("returning_customer_message"),

  // Plan / limits (shared — used across apps)
  plan: text("plan").default("starter"),
  product: text("product").default("reviews"),
  smsLimit: integer("sms_limit").default(100),
  clientLimit: integer("client_limit").default(50),
  trialEndsAt: text("trial_ends_at"),

  // Locale / hours
  timezone: text("timezone").default("America/New_York"),
  businessHoursStart: integer("business_hours_start").default(9),
  businessHoursEnd: integer("business_hours_end").default(17),

  // Referral program (Reviews)
  referralEnabled: integer("referral_enabled").default(1),
  referralOfferText: text("referral_offer_text"),
  referralOfferAmount: text("referral_offer_amount"),
  referralCode: text("referral_code"),
  referredByBusinessId: integer("referred_by_business_id"),

  // Reviews-specific defaults
  cardTemplate: text("card_template").default("electric-gradient"),
  defaultReminderCount: integer("default_reminder_count").default(1),
  defaultReminderDelay: integer("default_reminder_delay").default(2),
  reviewCooldownDays: integer("review_cooldown_days").default(14),
  defaultTechnicianId: integer("default_technician_id"),
  funnelVideoUrl: text("funnel_video_url"),
  serviceOptions: text("service_options"),

  // Brand fields (added by Proof for caption generation; readable by all apps)
  brandTone: text("brand_tone").default("friendly"),
  brandKeywords: text("brand_keywords").default(""),
  brandAvoidWords: text("brand_avoid_words").default(""),
  brandSampleCaption: text("brand_sample_caption").default(""),
  brandTagline: text("brand_tagline").default(""),

  // Business profile fields (added later; readable by all apps)
  phone: text("phone"),
  website: text("website"),
  description: text("description"),
  serviceArea: text("service_area"),
  businessAddress: text("business_address"),
  businessCity: text("business_city"),
  businessState: text("business_state"),
  businessZip: text("business_zip"),

  // External API integration (Reviews)
  apiKey: text("api_key"),
  apiAutoSend: integer("api_auto_send").default(0),

  // CRM polling integration (Reviews)
  crmType: text("crm_type"),
  crmApiKey: text("crm_api_key"),
  crmApiSecret: text("crm_api_secret"),
  crmPollingEnabled: integer("crm_polling_enabled").default(0),
  crmPollingInterval: integer("crm_polling_interval").default(30),
  crmLastPolledAt: text("crm_last_polled_at"),
});

// ============================================================
// USERS — Authentication across all apps
// ============================================================
// Canonical identity table. Hosted Stack is intended to be a
// single-login system. Note: Proof currently has its own
// proof_users table from an earlier accident; that is on the
// known-issue list to be migrated to this shared table.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("owner"), // admin | owner | tech
  businessId: integer("business_id").references(() => businesses.id),
  name: text("name").notNull(),
  lastLoginAt: text("last_login_at"),
  onboardingComplete: integer("onboarding_complete").default(0),
  createdAt: text("created_at"),
});

// ============================================================
// USER PRODUCTS — Cross-app access control
// ============================================================
// One row per (user, business, product). Bundle purchases
// insert multiple rows atomically. Source of truth for which
// apps a user can log into.
export const userProducts = pgTable("user_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  product: text("product").notNull(), // "reviews" | "proof" | "reach" | "leads" | "presence" | "nudge"
  plan: text("plan").notNull().default("starter"), // "starter" | "growth" | "pro" | "free"
  status: text("status").notNull().default("trial"), // "active" | "trial" | "expired" | "cancelled"
  trialEndsAt: text("trial_ends_at"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at"),
});

// ============================================================
// CLIENTS — Customers of the business
// ============================================================
// Touched by: Reviews (owner), Reach (read+write for postcards),
//             Leads (read+write for attribution).
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  address: text("address"),
  address2: text("address2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  externalId: text("external_id"), // CRM external id (Reviews CRM polling)
  deletedAt: text("deleted_at"),    // Soft delete
  createdAt: text("created_at"),
});

// ============================================================
// TECHNICIANS — Field workers
// ============================================================
// Touched by: Reviews (owner), Proof (read for tech-attributed posts).
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  active: integer("active").default(1),
  createdAt: text("created_at"),
});

// ============================================================
// REVIEW REQUESTS — Each SMS / email review request
// ============================================================
// Touched by: Reviews (owner). Reach reads aggregate stats only.
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  channel: text("channel").notNull().default("sms"),
  status: text("status").notNull().default("sent"),

  // Lifecycle timestamps
  sentAt: text("sent_at"),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  reviewedAt: text("reviewed_at"),

  // Reminders
  reminderCount: integer("reminder_count").default(0),
  reminderDelay: integer("reminder_delay").default(2),
  reminder1SentAt: text("reminder_1_sent_at"),
  reminder2SentAt: text("reminder_2_sent_at"),

  // Attribution
  technicianId: integer("technician_id"),
  technicianIds: text("technician_ids"), // JSON array for multi-tech jobs
  serviceTypes: text("service_types"),
  source: text("source").default("manual"), // "manual" | "auto" | "api" | "crm"
  approvalStatus: text("approval_status").default("approved"),

  // Twilio
  smsSid: text("sms_sid"),
  deliveryStatus: text("delivery_status").default("pending"),
  messageText: text("message_text"),

  // Soft delete
  deletedAt: text("deleted_at"),
});

// ============================================================
// FEEDBACK — Low-rating customer feedback (Reviews primary)
// ============================================================
// Touched by: Reviews (owner). Proof may read positive feedback for
// review-to-post features in the future.
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  reviewRequestId: integer("review_request_id"),
  rating: integer("rating"),
  message: text("message").notNull(),
  clientName: text("client_name"),
  createdAt: text("created_at"),
});

// ============================================================
// REFERRALS — Customer referral tracking (Reviews)
// ============================================================
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  referrerName: text("referrer_name"),
  referrerPhone: text("referrer_phone"),
  referredName: text("referred_name"),
  referredPhone: text("referred_phone"),
  referredEmail: text("referred_email"),
  status: text("status").default("pending"),
  source: text("source"),
  createdAt: text("created_at"),
});

// ============================================================
// BUSINESS REFERRALS — B2B referral program (Reviews)
// ============================================================
export const businessReferrals = pgTable("business_referrals", {
  id: serial("id").primaryKey(),
  referrerBusinessId: integer("referrer_business_id").notNull().references(() => businesses.id),
  referredBusinessId: integer("referred_business_id").references(() => businesses.id),
  referredEmail: text("referred_email"),
  status: text("status").default("pending"),
  creditMonths: integer("credit_months").default(0),
  creditApplied: integer("credit_applied").default(0),
  createdAt: text("created_at"),
});

// ============================================================
// CARD ORDERS — Physical review card orders (Reviews)
// ============================================================
export const cardOrders = pgTable("card_orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull().default("pending"),
  shippingName: text("shipping_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  notes: text("notes"),
  createdAt: text("created_at"),
});
