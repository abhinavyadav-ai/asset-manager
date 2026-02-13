import { Navbar, Footer } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Package, MapPin, CreditCard, Loader2, Home, ShoppingBag, MessageCircle } from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/orders/number', orderNumber],
    queryFn: async () => {
      const res = await fetch(`/api/orders/number/${orderNumber}`);
      if (!res.ok) throw new Error('Order not found');
      return res.json();
    },
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin gold-text mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neo-card p-16 rounded-2xl text-center max-w-md"
          >
            <Package className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h2 className="font-serif text-3xl mb-4 text-foreground">Order Not Found</h2>
            <p className="text-muted-foreground mb-8">
              We couldn't find an order with that number.
            </p>
            <Link 
              href="/" 
              className="gold-button inline-flex items-center gap-3 px-10 py-4 rounded-xl uppercase tracking-wider text-sm"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = order.items as OrderItem[];

  return (
    <div className="min-h-screen bg-background flex flex-col noise-texture">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </motion.div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
              Order <span className="gold-gradient-text">Confirmed!</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Thank you for your purchase. We'll send you a confirmation soon.
            </p>
          </motion.div>

          {/* Order Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="neo-card p-8 rounded-2xl text-center mb-8"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Order Number</p>
            <p className="font-mono text-3xl gold-gradient-text font-bold" data-testid="text-order-number">
              {order.orderNumber}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="neo-card p-8 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 gold-text" />
                <h2 className="font-serif text-xl text-foreground">Order Details</h2>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    {item.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="gold-text font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="premium-divider my-6" />

              <div className="space-y-2">
                <div className="flex justify-between text-foreground/80">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground/80">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping?.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2">
                  <span>Total</span>
                  <span className="gold-gradient-text">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>

            {/* Shipping & Payment */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="neo-card p-8 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 gold-text" />
                  <h2 className="font-serif text-xl text-foreground">Shipping Address</h2>
                </div>
                <div className="text-foreground/80 space-y-1">
                  <p className="font-semibold text-foreground">{order.customerName}</p>
                  <p>{order.phone}</p>
                  <p>{order.address}</p>
                  <p>{order.city}, {order.state} {order.pincode}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="neo-card p-8 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 gold-text" />
                  <h2 className="font-serif text-xl text-foreground">Payment</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="text-foreground capitalize">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`capitalize font-semibold ${
                      order.paymentStatus === 'paid' ? 'text-green-500' : 'gold-text'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="neo-card p-6 rounded-2xl mt-8 text-center"
          >
            <p className="text-muted-foreground mb-4">Need help with your order?</p>
            <a
              href={`https://wa.me/919279547350?text=Hi! I have a question about my order ${order.orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#fff",
              }}
              data-testid="button-whatsapp-order"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            <Link 
              href="/products" 
              className="gold-button inline-flex items-center gap-3 px-10 py-4 rounded-xl uppercase tracking-wider text-sm"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Link>
            <Link 
              href="/" 
              className="gold-outline-button inline-flex items-center gap-3 px-10 py-4 rounded-xl uppercase tracking-wider text-sm"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
