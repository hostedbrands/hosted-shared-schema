/**
 * HOSTED BRANDS — Shared Types
 * 
 * Type definitions for all shared tables.
 * Import these in your app instead of redefining them.
 */

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
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
} from "./tables.js";

// Insert schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertTechnicianSchema = createInsertSchema(technicians).omit({ id: true });
export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({ id: true });
export const insertUserProductSchema = createInsertSchema(userProducts).omit({ id: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true });
export const insertBusinessReferralSchema = createInsertSchema(businessReferrals).omit({ id: true });
export const insertCardOrderSchema = createInsertSchema(cardOrders).omit({ id: true });

// Insert types
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;
export type InsertUserProduct = z.infer<typeof insertUserProductSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertBusinessReferral = z.infer<typeof insertBusinessReferralSchema>;
export type InsertCardOrder = z.infer<typeof insertCardOrderSchema>;

// Select types
export type Business = typeof businesses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type UserProduct = typeof userProducts.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type BusinessReferral = typeof businessReferrals.$inferSelect;
export type CardOrder = typeof cardOrders.$inferSelect;
