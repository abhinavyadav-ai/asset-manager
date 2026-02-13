import { db } from "./db";
import {
  users,
  products,
  orders,
  coupons,
  siteSettings,
  reviews,
  bulkDiscounts,
  flashSales,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Coupon,
  type InsertCoupon,
  type SiteSetting,
  type Review,
  type InsertReview,
  type BulkDiscount,
  type InsertBulkDiscount,
  type FlashSale,
  type InsertFlashSale,
} from "@shared/schema";
import { eq, desc, and, gt, or, isNull, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User/Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  updateStock(id: number, quantity: number): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderPayment(id: number, paymentStatus: string, razorpayPaymentId?: string): Promise<Order>;
  updateOrderTracking(id: number, trackingNumber: string, deliveryPartner: string): Promise<Order>;
  deleteOrder(id: number): Promise<void>;

  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon>;
  deleteCoupon(id: number): Promise<void>;
  incrementCouponUsage(code: string): Promise<void>;

  // Site Settings
  getSetting(key: string): Promise<SiteSetting | undefined>;
  setSetting(key: string, value: string): Promise<SiteSetting>;
  getAllSettings(): Promise<SiteSetting[]>;

  // Reviews
  getReviews(): Promise<Review[]>;
  getApprovedReviewsByProduct(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  approveReview(id: number): Promise<Review>;
  deleteReview(id: number): Promise<void>;

  // Bulk Discounts
  getBulkDiscounts(): Promise<BulkDiscount[]>;
  getActiveBulkDiscounts(): Promise<BulkDiscount[]>;
  createBulkDiscount(discount: InsertBulkDiscount): Promise<BulkDiscount>;
  updateBulkDiscount(id: number, discount: Partial<InsertBulkDiscount>): Promise<BulkDiscount>;
  deleteBulkDiscount(id: number): Promise<void>;

  // Flash Sales
  getFlashSales(): Promise<FlashSale[]>;
  getActiveFlashSale(): Promise<FlashSale | undefined>;
  createFlashSale(sale: InsertFlashSale): Promise<FlashSale>;
  updateFlashSale(id: number, sale: Partial<InsertFlashSale>): Promise<FlashSale>;
  deleteFlashSale(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User/Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateStock(id: number, quantity: number): Promise<void> {
    const product = await this.getProduct(id);
    if (product) {
      await db
        .update(products)
        .set({ stock: Math.max(0, product.stock - quantity) })
        .where(eq(products.id, id));
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPayment(id: number, paymentStatus: string, razorpayPaymentId?: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ 
        paymentStatus, 
        ...(razorpayPaymentId && { razorpayPaymentId }),
        ...(paymentStatus === 'paid' && { status: 'confirmed' })
      })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderTracking(id: number, trackingNumber: string, deliveryPartner: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ trackingNumber, deliveryPartner })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.isActive, true),
          or(
            isNull(coupons.expiresAt),
            gt(coupons.expiresAt, new Date())
          )
        )
      );
    return coupon;
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values({
      ...insertCoupon,
      code: insertCoupon.code.toUpperCase()
    }).returning();
    return coupon;
  }

  async updateCoupon(id: number, updates: Partial<InsertCoupon>): Promise<Coupon> {
    const [updated] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();
    return updated;
  }

  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementCouponUsage(code: string): Promise<void> {
    const coupon = await this.getCouponByCode(code);
    if (coupon) {
      await db
        .update(coupons)
        .set({ usedCount: (coupon.usedCount || 0) + 1 })
        .where(eq(coupons.id, coupon.id));
    }
  }

  // Site Settings
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings).values({ key, value }).returning();
    return created;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getApprovedReviewsByProduct(productId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async approveReview(id: number): Promise<Review> {
    const [updated] = await db
      .update(reviews)
      .set({ isApproved: true })
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Bulk Discounts
  async getBulkDiscounts(): Promise<BulkDiscount[]> {
    return await db.select().from(bulkDiscounts).orderBy(desc(bulkDiscounts.createdAt));
  }

  async getActiveBulkDiscounts(): Promise<BulkDiscount[]> {
    return await db
      .select()
      .from(bulkDiscounts)
      .where(eq(bulkDiscounts.isActive, true))
      .orderBy(bulkDiscounts.minQuantity);
  }

  async createBulkDiscount(insertDiscount: InsertBulkDiscount): Promise<BulkDiscount> {
    const [discount] = await db.insert(bulkDiscounts).values(insertDiscount).returning();
    return discount;
  }

  async updateBulkDiscount(id: number, updates: Partial<InsertBulkDiscount>): Promise<BulkDiscount> {
    const [updated] = await db
      .update(bulkDiscounts)
      .set(updates)
      .where(eq(bulkDiscounts.id, id))
      .returning();
    return updated;
  }

  async deleteBulkDiscount(id: number): Promise<void> {
    await db.delete(bulkDiscounts).where(eq(bulkDiscounts.id, id));
  }

  // Flash Sales
  async getFlashSales(): Promise<FlashSale[]> {
    return await db.select().from(flashSales).orderBy(desc(flashSales.createdAt));
  }

  async getActiveFlashSale(): Promise<FlashSale | undefined> {
    const now = new Date();
    const [sale] = await db
      .select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.isActive, true),
          lte(flashSales.startDate, now),
          gte(flashSales.endDate, now)
        )
      )
      .orderBy(desc(flashSales.createdAt))
      .limit(1);
    return sale;
  }

  async createFlashSale(insertSale: InsertFlashSale): Promise<FlashSale> {
    const [sale] = await db.insert(flashSales).values(insertSale).returning();
    return sale;
  }

  async updateFlashSale(id: number, updates: Partial<InsertFlashSale>): Promise<FlashSale> {
    const [updated] = await db
      .update(flashSales)
      .set(updates)
      .where(eq(flashSales.id, id))
      .returning();
    return updated;
  }

  async deleteFlashSale(id: number): Promise<void> {
    await db.delete(flashSales).where(eq(flashSales.id, id));
  }
}

export const storage = new DatabaseStorage();
