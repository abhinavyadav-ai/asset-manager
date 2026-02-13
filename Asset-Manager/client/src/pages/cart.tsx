import { Navbar, Footer } from "@/components/layout";
import { useCart } from "@/contexts/cart-context";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total, clearCart } = useCart();

  const freeShippingThreshold = 75;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col noise-texture">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="font-serif text-5xl md:text-6xl mb-4">
              Your <span className="gold-gradient-text">Cart</span>
            </h1>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neo-card p-16 rounded-2xl text-center"
            >
              <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h2 className="font-serif text-3xl mb-4 text-foreground">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Discover our exquisite collection of hand-poured luxury candles and fill your space with beautiful fragrances.
              </p>
              <Link 
                href="/products" 
                className="gold-button inline-flex items-center gap-3 px-10 py-4 rounded-xl uppercase tracking-wider text-sm"
                data-testid="link-continue-shopping"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Free Shipping Progress */}
                {subtotal < freeShippingThreshold && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neo-card p-6 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Truck className="w-5 h-5 gold-text" />
                      <span className="text-sm text-foreground">
                        Add <span className="gold-text font-bold">₹{(freeShippingThreshold - subtotal).toFixed(2)}</span> more for free shipping
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToFreeShipping}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="neo-card p-6 rounded-2xl"
                      data-testid={`cart-item-${item.productId}`}
                    >
                      <div className="flex gap-6">
                        {/* Image */}
                        <Link href={`/products/${item.productId}`} className="shrink-0">
                          <div className="w-28 h-28 rounded-xl overflow-hidden bg-secondary">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <Link 
                              href={`/products/${item.productId}`}
                              className="font-serif text-xl text-foreground hover:gold-text transition-colors"
                            >
                              {item.name}
                            </Link>
                            <p className="gold-text text-lg font-semibold mt-1">
                              ₹{item.price.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-10 h-10 rounded-xl neo-card flex items-center justify-center hover:border-primary/30 transition-colors"
                                data-testid={`button-decrease-${item.productId}`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-semibold" data-testid={`quantity-${item.productId}`}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-10 h-10 rounded-xl neo-card flex items-center justify-center hover:border-primary/30 transition-colors"
                                data-testid={`button-increase-${item.productId}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="p-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              data-testid={`button-remove-${item.productId}`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="hidden sm:flex flex-col items-end justify-center">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</span>
                          <span className="font-serif text-2xl gold-gradient-text">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link 
                    href="/products" 
                    className="gold-outline-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                  <button
                    onClick={clearCart}
                    className="px-6 py-3 rounded-xl text-sm uppercase tracking-wider text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    data-testid="button-clear-cart"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="neo-card p-8 rounded-2xl sticky top-32"
                >
                  <h2 className="font-serif text-2xl mb-8 text-foreground">Order Summary</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-foreground/80">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-foreground/80">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? "gold-text font-semibold" : ""}>
                        {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="premium-divider my-6" />
                    <div className="flex justify-between text-xl">
                      <span className="font-serif">Total</span>
                      <span className="gold-gradient-text font-bold">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="gold-button w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-xl uppercase tracking-wider text-sm font-bold"
                    data-testid="button-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <p className="text-xs text-muted-foreground text-center mt-6">
                    Secure checkout with Razorpay or Cash on Delivery
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
