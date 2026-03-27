/**
 * @hostedbrands/shared-schema
 * 
 * Shared database schema for all Hosted Brands apps.
 * 
 * Usage in your app's schema.ts:
 * 
 *   import { businesses, users, clients, userProducts } from "@hostedbrands/shared-schema/tables";
 *   import type { Business, User, Client } from "@hostedbrands/shared-schema/types";
 * 
 * Or import everything:
 * 
 *   import { businesses, users, clients, type Business, type User } from "@hostedbrands/shared-schema";
 */

// Re-export all tables
export {
  businesses,
  users,
  clients,
  technicians,
  reviewRequests,
  userProducts,
  feedback,
  referrals,
  businessReferrals,
  cardOrders,
} from "./tables";

// Re-export all types
export type {
  Business,
  User,
  Client,
  Technician,
  ReviewRequest,
  UserProduct,
  Feedback,
  Referral,
  BusinessReferral,
  CardOrder,
  InsertBusiness,
  InsertUser,
  InsertClient,
  InsertTechnician,
  InsertReviewRequest,
  InsertUserProduct,
  InsertFeedback,
  InsertReferral,
  InsertBusinessReferral,
  InsertCardOrder,
} from "./types";

// Re-export insert schemas
export {
  insertBusinessSchema,
  insertUserSchema,
  insertClientSchema,
  insertTechnicianSchema,
  insertReviewRequestSchema,
  insertUserProductSchema,
  insertFeedbackSchema,
  insertReferralSchema,
  insertBusinessReferralSchema,
  insertCardOrderSchema,
} from "./types";
