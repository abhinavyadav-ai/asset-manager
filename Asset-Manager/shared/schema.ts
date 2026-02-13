import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (for Admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  costPrice: real("cost_price").notNull(),
  marginPercent: real("margin_percent").default(0),
  stock: integer("stock").default(0).notNull(),
  category: text("category").default("General"),
  images: text("images").array().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true, 
  createdAt: true 
});

// Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'percentage' | 'fixed'
  discountValue: real("discount_value").notNull(),
  minOrderValue: real("min_order_value").default(0),
  maxDiscount: real("max_discount"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ 
  id: true, 
  createdAt: true,
  usedCount: true 
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  items: jsonb("items").notNull(),
  subtotal: real("subtotal").notNull(),
  shipping: real("shipping").default(0),
  discountCode: text("discount_code"),
  discountAmount: real("discount_amount").default(0),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'razorpay' | 'cod'
  paymentStatus: text("payment_status").default("pending"), // 'pending' | 'paid' | 'failed'
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  status: text("status").default("pending"), // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber: text("tracking_number"),
  deliveryPartner: text("delivery_partner"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

// Order status options
export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

// Payment methods
export const PAYMENT_METHODS = ["razorpay", "upi"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

// Product Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, isApproved: true });
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Bulk Discounts
export const bulkDiscounts = pgTable("bulk_discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minQuantity: integer("min_quantity").notNull(),
  discountPercent: real("discount_percent").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBulkDiscountSchema = createInsertSchema(bulkDiscounts).omit({ id: true, createdAt: true });
export type BulkDiscount = typeof bulkDiscounts.$inferSelect;
export type InsertBulkDiscount = z.infer<typeof insertBulkDiscountSchema>;

// Flash Sales
export const flashSales = pgTable("flash_sales", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  bannerImage: text("banner_image"),
  discountPercent: real("discount_percent"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlashSaleSchema = createInsertSchema(flashSales).omit({ id: true, createdAt: true });
export type FlashSale = typeof flashSales.$inferSelect;
export type InsertFlashSale = z.infer<typeof insertFlashSaleSchema>;

// Chat models for AI chatbot
export * from "./models/chat";
