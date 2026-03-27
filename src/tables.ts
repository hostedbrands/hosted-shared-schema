/**
 * HOSTED BRANDS — Shared Database Tables
 * 
 * These tables are shared across ALL Hosted Brands apps.
 * They live in the same PostgreSQL database on Railway.
 * 
 * RULES:
 * 1. Only Hosted Reviews runs migrations on these tables (db:push)
 * 2. All other apps (Reach, Proof, Leads, Nudge) reference these tables READ/WRITE
 *    but NEVER run schema migrations on them
 * 3. When adding a column to a shared table, update it HERE first,
 *    then update Hosted Reviews schema, then run db:push from Reviews
 * 4. Each app's drizzle.config.ts must point to their app-specific schema only
 * 
 * Last updated: 2026-03-27
 */

import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

// ============================================================
// BUSINESSES — Core business entity across all apps
// ============================================================
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  googleReviewUrl: text("google_review_url"),
  facebookReviewUrl: text("facebook_review_url"),
  yelpReviewUrl: text("yelp_review_url"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0d9488"),
  status: text("status").default("active"),
  thankYouMessage: text("thank_you_message"),
  smsTemplate: text("sms_template"),
  plan: text("plan").default("starter"),
  product: text("product").default("reviews"),
  smsLimit: integer("sms_limit").default(100),
  clientLimit: integer("client_limit").default(50),
  timezone: text("timezone").default("America/New_York"),
  businessHoursStart: integer("business_hours_start").default(9),
  businessHoursEnd: integer("business_hours_end").default(17),
  reminderTemplate: text("reminder_template"),
  thankYouSmsTemplate: text("thank_you_sms_template"),
  createdAt: text("created_at"),
  referralEnabled: integer("referral_enabled").default(1),
  referralOfferText: text("referral_offer_text"),
  referralOfferAmount: text("referral_offer_amount"),
  referralCode: text("referral_code"),
  referredByBusinessId: integer("referred_by_business_id"),
  cardTemplate: text("card_template").default("electric-gradient"),
  defaultReminderCount: integer("default_reminder_count").default(1),
  defaultReminderDelay: integer("default_reminder_delay").default(2),
  trialEndsAt: text("trial_ends_at"),
  serviceOptions: text("service_options"),
});

// ============================================================
// USERS — Authentication across all apps
// ============================================================
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
// CLIENTS — Customers of the business (shared across Reviews, Reach, Leads)
// ============================================================
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
  createdAt: text("created_at"),
});

// ============================================================
// TECHNICIANS — Field workers (shared across Reviews, Proof)
// ============================================================
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  active: integer("active").default(1),
  createdAt: text("created_at"),
});

// ============================================================
// REVIEW REQUESTS — Tracks each review request (Reviews primary, Reach reads)
// ============================================================
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  channel: text("channel").notNull().default("sms"),
  status: text("status").notNull().default("sent"),
  sentAt: text("sent_at"),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  reviewedAt: text("reviewed_at"),
  reminderCount: integer("reminder_count").default(0),
  reminderDelay: integer("reminder_delay").default(2),
  reminder1SentAt: text("reminder_1_sent_at"),
  reminder2SentAt: text("reminder_2_sent_at"),
  technicianId: integer("technician_id"),
  technicianIds: text("technician_ids"),
  serviceTypes: text("service_types"),
});

// ============================================================
// USER PRODUCTS — Cross-app subscription/access control
// Tracks which Hosted products each user/business has access to
// ============================================================
export const userProducts = pgTable("user_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  product: text("product").notNull(), // "reviews" | "proof" | "reach" | "leads" | "nudge"
  plan: text("plan").notNull().default("starter"), // "starter" | "growth" | "pro" | "free"
  status: text("status").notNull().default("trial"), // "active" | "trial" | "expired" | "cancelled"
  trialEndsAt: text("trial_ends_at"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at"),
});

// ============================================================
// FEEDBACK — Customer feedback/reviews (Reviews primary, Proof reads for review-to-post)
// ============================================================
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
// REFERRALS — Customer referral tracking (Reviews primary)
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
// BUSINESS REFERRALS — B2B referral program (Reviews primary)
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
// CARD ORDERS — Physical review card orders (Reviews primary)
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
