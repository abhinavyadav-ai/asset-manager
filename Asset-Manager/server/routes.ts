import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import crypto from "crypto";
import type { OrderItem, Order } from "@shared/schema";
import { insertCouponSchema, insertReviewSchema, insertBulkDiscountSchema, insertFlashSaleSchema } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import Razorpay from "razorpay";
import { sendInvoiceEmail } from "./email";

// Initialize Razorpay if credentials are available
let razorpayInstance: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// WhatsApp notification helper
function getPaymentMethodName(method: string): string {
  switch (method) {
    case 'cod': return 'Cash on Delivery';
    case 'upi': return 'UPI Direct Payment';
    case 'razorpay': return 'Razorpay Online';
    default: return method;
  }
}

function sendWhatsAppNotification(order: Order) {
  const items = (order.items as OrderItem[]).map(i => `${i.quantity}x ${i.name} (₹${(i.price * i.quantity).toFixed(0)})`).join('\n');
  
  let message = `🕯️ *NEW ORDER RECEIVED!*\n\n`;
  message += `📦 *Order:* ${order.orderNumber}\n`;
  message += `👤 *Customer:* ${order.customerName}\n`;
  message += `📞 *Phone:* ${order.phone}\n`;
  if (order.email) {
    message += `📧 *Email:* ${order.email}\n`;
  }
  message += `\n🛒 *Items:*\n${items}\n\n`;
  message += `💰 *Subtotal:* ₹${order.subtotal.toFixed(2)}\n`;
  if (order.discountAmount && order.discountAmount > 0) {
    message += `🏷️ *Discount:* -₹${order.discountAmount.toFixed(2)}${order.discountCode ? ` (${order.discountCode})` : ''}\n`;
  }
  message += `🚚 *Shipping:* ${(order.shipping ?? 0) === 0 ? 'FREE' : `₹${(order.shipping ?? 0).toFixed(2)}`}\n`;
  message += `\n✨ *TOTAL: ₹${order.total.toFixed(2)}*\n\n`;
  message += `💳 *Payment:* ${getPaymentMethodName(order.paymentMethod)}\n`;
  message += `📋 *Status:* ${order.paymentStatus === 'pending_verification' ? 'Payment Pending Verification' : order.paymentStatus}\n\n`;
  message += `📍 *Delivery Address:*\n`;
  message += `${order.address}\n`;
  message += `${order.city}, ${order.state} - ${order.pincode}\n`;
  
  return `https://wa.me/919279547350?text=${encodeURIComponent(message)}`;
}

function generateOrderNumber(): string {
  const prefix = 'LUM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Generate customer invoice WhatsApp message
function generateCustomerInvoiceWhatsApp(order: Order, invoiceUrl: string): string {
  const items = (order.items as OrderItem[]).map(i => `• ${i.name} x${i.quantity} - ₹${(i.price * i.quantity).toFixed(0)}`).join('\n');
  
  let message = `🕯️ *LUXE CANDLE - ORDER INVOICE*\n\n`;
  message += `Thank you for your order! 🙏\n\n`;
  message += `📦 *Order Number:* ${order.orderNumber}\n`;
  message += `📅 *Date:* ${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}\n\n`;
  message += `🛒 *Your Items:*\n${items}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 Subtotal: ₹${order.subtotal.toFixed(2)}\n`;
  if (order.discountAmount && order.discountAmount > 0) {
    message += `🏷️ Discount: -₹${order.discountAmount.toFixed(2)}\n`;
  }
  message += `🚚 Shipping: ${(order.shipping ?? 0) === 0 ? 'FREE' : `₹${(order.shipping ?? 0).toFixed(2)}`}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `✨ *TOTAL: ₹${order.total.toFixed(2)}*\n\n`;
  message += `💳 *Payment:* ${getPaymentMethodName(order.paymentMethod)}\n\n`;
  message += `📍 *Delivery Address:*\n`;
  message += `${order.customerName}\n`;
  message += `${order.address}\n`;
  message += `${order.city}, ${order.state} - ${order.pincode}\n\n`;
  message += `📄 *View Invoice:* ${invoiceUrl}\n\n`;
  message += `For any queries, contact us!\n`;
  message += `Thank you for shopping with Luxe Candle! 🕯️✨`;
  
  return `https://wa.me/${order.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
}

// Generate HTML invoice
function generateInvoiceHTML(order: Order): string {
  const items = order.items as OrderItem[];
  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #333;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber} | Luxe Candle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #050505;
      color: #fff;
      padding: 20px;
      min-height: 100vh;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #F5A623 0%, #D4920A 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #000;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 3px;
    }
    .header p {
      color: #000;
      opacity: 0.8;
      margin-top: 5px;
    }
    .content { padding: 30px; }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .invoice-info div { flex: 1; min-width: 200px; }
    .invoice-info h3 {
      color: #F5A623;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-info p { color: #ccc; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th {
      background: #1a1a1a;
      color: #F5A623;
      padding: 15px 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
    th:last-child { text-align: right; }
    td { color: #ccc; }
    .totals {
      background: #111;
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #999;
    }
    .totals-row.total {
      border-top: 1px solid #333;
      padding-top: 15px;
      margin-top: 10px;
      color: #F5A623;
      font-size: 20px;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #222;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-paid { background: #22c55e20; color: #22c55e; }
    .status-pending { background: #eab30820; color: #eab308; }
    @media print {
      body { background: #fff; color: #000; }
      .invoice-container { border: 1px solid #ddd; }
      .content { background: #fff; }
      td, .invoice-info p { color: #333; }
      .totals { background: #f5f5f5; }
      .totals-row { color: #666; }
    }
    .print-btn {
      display: block;
      margin: 20px auto;
      padding: 12px 30px;
      background: linear-gradient(135deg, #F5A623 0%, #D4920A 100%);
      color: #000;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>LUXE CANDLE</h1>
      <p>Premium Luxury Candles</p>
    </div>
    <div class="content">
      <div class="invoice-info">
        <div>
          <h3>Invoice To</h3>
          <p><strong>${order.customerName}</strong></p>
          <p>${order.phone}</p>
          ${order.email ? `<p>${order.email}</p>` : ''}
          <p>${order.address}</p>
          <p>${order.city}, ${order.state} - ${order.pincode}</p>
        </div>
        <div>
          <h3>Invoice Details</h3>
          <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}</p>
          <p><strong>Payment:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
          <p>
            <span class="status-badge ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
              ${order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        ${order.discountAmount && order.discountAmount > 0 ? `
        <div class="totals-row">
          <span>Discount ${order.discountCode ? `(${order.discountCode})` : ''}</span>
          <span>-₹${order.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="totals-row">
          <span>Shipping</span>
          <span>${(order.shipping ?? 0) === 0 ? 'FREE' : `₹${(order.shipping ?? 0).toFixed(2)}`}</span>
        </div>
        <div class="totals-row total">
          <span>Total Amount</span>
          <span>₹${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for shopping with Luxe Candle!</p>
      <p>For queries: luxebyras@gmail.com | +91 9279547350</p>
    </div>
  </div>
  <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
</body>
</html>
  `;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupAuth(app);
  
  // Register AI chat routes
  registerChatRoutes(app);
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

  // === Products ===
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(404).json({ message: "Product not found" });
    }
  });

  app.patch('/api/products/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const partialSchema = api.products.update.input.partial();
      const input = partialSchema.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // === Orders ===
  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.get('/api/orders/number/:orderNumber', async (req, res) => {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      // Validate request body
      const items = req.body.items as OrderItem[];
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Check stock availability for all items and calculate subtotal
      let calculatedSubtotal = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.name} not found` });
        }
        if ((product.stock ?? 0) < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name}. Available: ${product.stock ?? 0}` 
          });
        }
        calculatedSubtotal += product.price * item.quantity;
      }
      
      // Server-side coupon validation
      let discountAmount = 0;
      let validatedCouponCode: string | null = null;
      
      if (req.body.discountCode) {
        const coupon = await storage.getCouponByCode(req.body.discountCode);
        if (!coupon) {
          return res.status(400).json({ message: "Invalid or expired coupon code" });
        }
        // Explicit isActive check
        if (!coupon.isActive) {
          return res.status(400).json({ message: "This coupon is no longer active" });
        }
        // Explicit expiry check
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return res.status(400).json({ message: "This coupon has expired" });
        }
        // Usage limit check (handles 0/null usedCount)
        if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
          return res.status(400).json({ message: "Coupon usage limit reached" });
        }
        if (coupon.minOrderValue && calculatedSubtotal < coupon.minOrderValue) {
          return res.status(400).json({ 
            message: `Minimum order of ₹${coupon.minOrderValue} required for this coupon` 
          });
        }
        
        // Calculate discount on server
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.min(
            calculatedSubtotal * (coupon.discountValue / 100), 
            coupon.maxDiscount || Infinity
          );
        } else {
          discountAmount = Math.min(coupon.discountValue, calculatedSubtotal);
        }
        validatedCouponCode = coupon.code;
      }
      
      // Calculate server-side total
      const shipping = calculatedSubtotal >= 75 ? 0 : 8.99;
      const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount + shipping);
      
      const orderNumber = generateOrderNumber();
      const input = {
        ...req.body,
        orderNumber,
        subtotal: calculatedSubtotal,
        shipping,
        discountCode: validatedCouponCode,
        discountAmount,
        total: calculatedTotal,
      };
      const order = await storage.createOrder(input);
      
      // Update stock for each item
      for (const item of items) {
        await storage.updateStock(item.productId, item.quantity);
      }
      
      // Increment coupon usage if coupon was applied
      if (validatedCouponCode) {
        await storage.incrementCouponUsage(validatedCouponCode);
      }
      
      // Generate WhatsApp notification URL for admin
      const whatsappNotifyUrl = sendWhatsAppNotification(order);
      
      res.status(201).json({ ...order, whatsappNotifyUrl });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Order creation error:', err);
      return res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { status } = req.body;
      const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const order = await storage.updateOrderStatus(Number(req.params.id), status);
      res.json(order);
    } catch (err) {
      return res.status(404).json({ message: "Order not found" });
    }
  });

  // Update order tracking
  app.patch('/api/orders/:id/tracking', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { trackingNumber, deliveryPartner } = req.body;
      if (!trackingNumber || !deliveryPartner) {
        return res.status(400).json({ message: "Tracking number and delivery partner required" });
      }
      const order = await storage.updateOrderTracking(Number(req.params.id), trackingNumber, deliveryPartner);
      res.json(order);
    } catch (err) {
      return res.status(404).json({ message: "Order not found" });
    }
  });

  // Get WhatsApp notification URL for order
  app.get('/api/orders/:id/whatsapp-notify', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const whatsappUrl = sendWhatsAppNotification(order);
      res.json({ whatsappUrl });
    } catch (err) {
      return res.status(500).json({ message: "Failed to generate notification" });
    }
  });

  // Delete order (admin only)
  app.delete('/api/orders/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.deleteOrder(Number(req.params.id));
      res.json({ message: "Order deleted successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // === Invoice Routes ===
  
  // View invoice HTML page
  app.get('/invoice/:orderNumber', async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) return res.status(404).send('Invoice not found');
      const html = generateInvoiceHTML(order);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      return res.status(500).send('Error generating invoice');
    }
  });

  // Get invoice WhatsApp share link for customer (admin only)
  app.get('/api/orders/:id/send-invoice', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      
      // Generate invoice URL
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const invoiceUrl = `${protocol}://${host}/invoice/${order.orderNumber}`;
      
      // Generate WhatsApp link to send to customer
      const customerWhatsAppUrl = generateCustomerInvoiceWhatsApp(order, invoiceUrl);
      
      res.json({ 
        invoiceUrl,
        customerWhatsAppUrl,
        customerPhone: order.phone,
        customerEmail: order.email
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Send invoice via email (admin only)
  app.post('/api/orders/:id/send-invoice-email', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      
      if (!order.email) {
        return res.status(400).json({ message: "Customer email not available" });
      }
      
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const invoiceUrl = `${protocol}://${host}/invoice/${order.orderNumber}`;
      
      const result = await sendInvoiceEmail(order, invoiceUrl);
      
      if (result.success) {
        res.json({ message: "Invoice sent successfully", email: order.email });
      } else {
        res.status(500).json({ message: result.error || "Failed to send email" });
      }
    } catch (err) {
      console.error('Email send error:', err);
      return res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // === Site Settings ===
  
  // Get a specific setting (public)
  app.get('/api/settings/:key', async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) return res.status(404).json({ message: "Setting not found" });
      res.json(setting);
    } catch (err) {
      return res.status(500).json({ message: "Failed to get setting" });
    }
  });

  // Get all settings (admin only)
  app.get('/api/settings', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (err) {
      return res.status(500).json({ message: "Failed to get settings" });
    }
  });

  // Set a setting (admin only)
  app.post('/api/settings', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { key, value } = req.body;
      if (!key || typeof value !== 'string') {
        return res.status(400).json({ message: "Key and value are required" });
      }
      const setting = await storage.setSetting(key, value);
      res.json(setting);
    } catch (err) {
      return res.status(500).json({ message: "Failed to save setting" });
    }
  });

  // === Razorpay Payment ===
  
  // Check if Razorpay is configured
  app.get('/api/razorpay/config', (req, res) => {
    res.json({ 
      configured: !!razorpayInstance,
      keyId: process.env.RAZORPAY_KEY_ID || null
    });
  });

  // Create Razorpay order
  app.post('/api/razorpay/create-order', async (req, res) => {
    if (!razorpayInstance) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }
    
    try {
      const { amount, currency = "INR", receipt, notes } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: receipt || `order_${Date.now()}`,
        notes: notes || {},
      };
      
      const order = await razorpayInstance.orders.create(options);
      res.json(order);
    } catch (err: any) {
      console.error("Razorpay order creation error:", err);
      return res.status(500).json({ message: err.message || "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment
  app.post('/api/razorpay/verify', async (req, res) => {
    if (!razorpayInstance) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }
    
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment verification data" });
      }
      
      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");
      
      const isAuthentic = expectedSignature === razorpay_signature;
      
      if (isAuthentic) {
        // Update order payment status
        if (orderId) {
          await storage.updateOrderPayment(Number(orderId), "paid", razorpay_payment_id);
        }
        res.json({ verified: true, paymentId: razorpay_payment_id });
      } else {
        res.status(400).json({ verified: false, message: "Payment verification failed" });
      }
    } catch (err: any) {
      console.error("Razorpay verification error:", err);
      return res.status(500).json({ message: err.message || "Payment verification failed" });
    }
  });

  // === Coupons ===
  app.get('/api/coupons', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const coupons = await storage.getCoupons();
    res.json(coupons);
  });

  app.get('/api/coupons/validate/:code', async (req, res) => {
    try {
      const coupon = await storage.getCouponByCode(req.params.code);
      if (!coupon) {
        return res.status(404).json({ message: "Invalid or expired coupon code" });
      }
      // Explicit isActive check
      if (!coupon.isActive) {
        return res.status(400).json({ message: "This coupon is no longer active" });
      }
      // Explicit expiry check
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This coupon has expired" });
      }
      // Usage limit check (handles 0/null usedCount)
      if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }
      res.json(coupon);
    } catch (err) {
      return res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  app.post('/api/coupons', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(input);
      res.status(201).json(coupon);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.patch('/api/coupons/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const coupon = await storage.updateCoupon(Number(req.params.id), req.body);
      res.json(coupon);
    } catch (err) {
      return res.status(404).json({ message: "Coupon not found" });
    }
  });

  app.delete('/api/coupons/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteCoupon(Number(req.params.id));
    res.status(204).send();
  });

  // === Reviews ===
  
  // Get all reviews (admin)
  app.get('/api/reviews', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  // Get approved reviews for a product (public)
  app.get('/api/products/:id/reviews', async (req, res) => {
    const reviews = await storage.getApprovedReviewsByProduct(Number(req.params.id));
    res.json(reviews);
  });

  // Submit a review (public)
  app.post('/api/reviews', async (req, res) => {
    try {
      const input = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(input);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Approve a review (admin)
  app.patch('/api/reviews/:id/approve', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const review = await storage.approveReview(Number(req.params.id));
      res.json(review);
    } catch (err) {
      return res.status(404).json({ message: "Review not found" });
    }
  });

  // Delete a review (admin)
  app.delete('/api/reviews/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteReview(Number(req.params.id));
    res.status(204).send();
  });

  // === Bulk Discounts ===
  
  // Get all bulk discounts (admin)
  app.get('/api/bulk-discounts', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const discounts = await storage.getBulkDiscounts();
    res.json(discounts);
  });

  // Get active bulk discounts (public - for cart calculation)
  app.get('/api/bulk-discounts/active', async (req, res) => {
    const discounts = await storage.getActiveBulkDiscounts();
    res.json(discounts);
  });

  // Create bulk discount (admin)
  app.post('/api/bulk-discounts', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertBulkDiscountSchema.parse(req.body);
      const discount = await storage.createBulkDiscount(input);
      res.status(201).json(discount);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Failed to create bulk discount" });
    }
  });

  // Update bulk discount (admin)
  app.patch('/api/bulk-discounts/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const discount = await storage.updateBulkDiscount(Number(req.params.id), req.body);
      res.json(discount);
    } catch (err) {
      return res.status(404).json({ message: "Bulk discount not found" });
    }
  });

  // Delete bulk discount (admin)
  app.delete('/api/bulk-discounts/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteBulkDiscount(Number(req.params.id));
    res.status(204).send();
  });

  // === Flash Sales ===
  
  // Get all flash sales (admin)
  app.get('/api/flash-sales', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const sales = await storage.getFlashSales();
    res.json(sales);
  });

  // Get active flash sale (public - for homepage banner)
  app.get('/api/flash-sales/active', async (req, res) => {
    const sale = await storage.getActiveFlashSale();
    res.json(sale || null);
  });

  // Create flash sale (admin)
  app.post('/api/flash-sales', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertFlashSaleSchema.parse(req.body);
      const sale = await storage.createFlashSale(input);
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Failed to create flash sale" });
    }
  });

  // Update flash sale (admin)
  app.patch('/api/flash-sales/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const sale = await storage.updateFlashSale(Number(req.params.id), req.body);
      res.json(sale);
    } catch (err) {
      return res.status(404).json({ message: "Flash sale not found" });
    }
  });

  // Delete flash sale (admin)
  app.delete('/api/flash-sales/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteFlashSale(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data (if empty)
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    console.log("Seeding products...");
    await storage.createProduct({
      name: "Midnight Jasmine",
      description: "A soothing blend of jasmine and sandalwood. Perfect for relaxing evenings and creating a tranquil atmosphere in your home.",
      price: 29.99,
      costPrice: 12.00,
      marginPercent: 150,
      stock: 50,
      category: "Floral",
      images: ["https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
    await storage.createProduct({
      name: "Vanilla Bean",
      description: "Rich, creamy vanilla with a hint of musk. A classic favorite that brings warmth and comfort to any space.",
      price: 24.99,
      costPrice: 10.00,
      marginPercent: 150,
      stock: 75,
      category: "Sweet",
      images: ["https://images.unsplash.com/photo-1570823635306-250abb06d453?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
    await storage.createProduct({
      name: "Ocean Breeze",
      description: "Fresh, crisp, and clean. Reminiscent of a day at the beach with notes of sea salt and driftwood.",
      price: 27.99,
      costPrice: 11.50,
      marginPercent: 143,
      stock: 60,
      category: "Fresh",
      images: ["https://images.unsplash.com/photo-1602825389660-3f58693cc541?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
    await storage.createProduct({
      name: "Rose Garden",
      description: "Elegant rose petals with hints of peony and soft musk. A sophisticated floral experience.",
      price: 34.99,
      costPrice: 14.00,
      marginPercent: 150,
      stock: 40,
      category: "Floral",
      images: ["https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
    await storage.createProduct({
      name: "Cedar & Sage",
      description: "Earthy cedarwood balanced with aromatic sage. Perfect for creating a grounding, meditative atmosphere.",
      price: 32.99,
      costPrice: 13.00,
      marginPercent: 154,
      stock: 45,
      category: "Woody",
      images: ["https://images.unsplash.com/photo-1608181831718-c9ffd8685a63?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
    await storage.createProduct({
      name: "Lavender Dreams",
      description: "Calming French lavender with subtle notes of chamomile. Ideal for bedrooms and relaxation spaces.",
      price: 26.99,
      costPrice: 11.00,
      marginPercent: 145,
      stock: 55,
      category: "Floral",
      images: ["https://images.unsplash.com/photo-1599751449619-ad8a1050e67e?auto=format&fit=crop&q=80&w=1000"],
      isActive: true
    });
  }

  return httpServer;
}
