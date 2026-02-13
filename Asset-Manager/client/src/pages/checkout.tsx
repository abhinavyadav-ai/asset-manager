import { Navbar, Footer } from "@/components/layout";
import { useCart } from "@/contexts/cart-context";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Banknote, ShieldCheck, ArrowLeft, Loader2, Package, Tag, X, Check, Smartphone, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Order, Coupon } from "@shared/schema";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentMethod = "razorpay" | "upi";

export default function Checkout() {
  const { items, subtotal, clearCart, getShippingForCity } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Fetch UPI ID from settings
  const { data: upiSetting } = useQuery<{ key: string; value: string } | null>({
    queryKey: ['/api/settings', 'merchant_upi_id'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings/merchant_upi_id');
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      } catch {
        return null;
      }
    }
  });
  
  const MERCHANT_UPI_ID = upiSetting?.value || "abhinavyaduvanshi100-1@oksbi";

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use free reverse geocoding API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            
            // Build address string
            const addressParts: string[] = [];
            if (addr.house_number) addressParts.push(addr.house_number);
            if (addr.road) addressParts.push(addr.road);
            if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
            if (addr.suburb) addressParts.push(addr.suburb);
            
            setFormData(prev => ({
              ...prev,
              address: addressParts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '',
              city: addr.city || addr.town || addr.village || addr.county || '',
              state: addr.state || '',
              pincode: addr.postcode || '',
            }));
            
            toast({
              title: "Location Captured",
              description: "Address has been auto-filled. Please verify and add details.",
            });
          }
        } catch (err) {
          toast({
            title: "Error",
            description: "Could not fetch address. Please enter manually.",
            variant: "destructive",
          });
        }
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location unavailable. Please enter address manually.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check if Razorpay is configured
  const { data: razorpayConfig } = useQuery<{ configured: boolean; keyId: string | null }>({
    queryKey: ['/api/razorpay/config'],
  });

  // Load Razorpay script
  useEffect(() => {
    if (razorpayConfig?.configured && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [razorpayConfig]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Calculate shipping based on city - Delhi is free, others ₹45
  const shipping = getShippingForCity(formData.city);

  // Calculate discount
  const discountAmount = appliedCoupon ? (
    appliedCoupon.discountType === 'percentage'
      ? Math.min(subtotal * (appliedCoupon.discountValue / 100), appliedCoupon.maxDiscount || Infinity)
      : Math.min(appliedCoupon.discountValue, subtotal)
  ) : 0;
  
  const finalTotal = Math.max(0, subtotal - discountAmount + shipping);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`/api/coupons/validate/${couponCode.toUpperCase()}`);
      if (!res.ok) {
        const error = await res.json();
        toast({ title: "Invalid Coupon", description: error.message, variant: "destructive" });
        return;
      }
      const coupon = await res.json() as Coupon;
      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        toast({ 
          title: "Minimum Order Required", 
          description: `This coupon requires a minimum order of ₹${coupon.minOrderValue}`, 
          variant: "destructive" 
        });
        return;
      }
      // Calculate discount for this coupon
      const newDiscount = coupon.discountType === 'percentage'
        ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
        : Math.min(coupon.discountValue, subtotal);
      
      setAppliedCoupon(coupon);
      toast({ title: "Coupon Applied!", description: `You saved ₹${newDiscount.toFixed(2)}` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to apply coupon", variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const createOrder = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json() as Promise<Order & { whatsappNotifyUrl?: string }>;
    },
    onSuccess: (order) => {
      clearCart();
      // Open WhatsApp notification for admin
      if (order.whatsappNotifyUrl) {
        window.open(order.whatsappNotifyUrl, '_blank');
      }
      navigate(`/order-confirmation/${order.orderNumber}`);
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    const orderItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    const orderData = {
      ...formData,
      items: orderItems,
      subtotal,
      shipping,
      discountCode: appliedCoupon?.code || null,
      discountAmount: discountAmount,
      total: finalTotal,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
    };

    // Handle UPI Direct payment
    if (paymentMethod === "upi") {
      if (!upiPaymentConfirmed) {
        toast({
          title: "Confirm Payment",
          description: "Please complete the UPI payment and check the confirmation box.",
          variant: "destructive",
        });
        return;
      }
      // Create order with pending payment (admin will verify)
      createOrder.mutate({
        ...orderData,
        paymentMethod: "upi",
        paymentStatus: "pending_verification",
      });
      return;
    }

    if (paymentMethod === "razorpay") {
      if (!razorpayConfig?.configured) {
        toast({
          title: "Payment Not Available",
          description: "Online payment is currently not configured. Please use UPI Direct or Cash on Delivery.",
          variant: "destructive",
        });
        return;
      }
      
      setIsProcessingPayment(true);
      try {
        // Create Razorpay order
        const razorpayOrderRes = await apiRequest("POST", "/api/razorpay/create-order", {
          amount: finalTotal,
          currency: "INR",
          receipt: `order_${Date.now()}`,
          notes: {
            customerName: formData.customerName,
            phone: formData.phone,
          },
        });
        const razorpayOrder = await razorpayOrderRes.json();
        
        // First create our order
        const orderRes = await apiRequest("POST", "/api/orders", orderData);
        const order = await orderRes.json() as Order;
        
        // Open Razorpay checkout
        const options = {
          key: razorpayConfig.keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Luxe Candle",
          description: "Luxury Candle Purchase",
          order_id: razorpayOrder.id,
          prefill: {
            name: formData.customerName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#F5A623",
          },
          handler: async function (response: any) {
            // Verify payment
            try {
              const verifyRes = await apiRequest("POST", "/api/razorpay/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              });
              const verifyData = await verifyRes.json();
              
              if (verifyData.verified) {
                clearCart();
                navigate(`/order-confirmation/${order.orderNumber}`);
              } else {
                toast({
                  title: "Payment Failed",
                  description: "Payment verification failed. Please contact support.",
                  variant: "destructive",
                });
              }
            } catch (err) {
              toast({
                title: "Error",
                description: "Payment verification failed. Please contact support.",
                variant: "destructive",
              });
            }
            setIsProcessingPayment(false);
          },
          modal: {
            ondismiss: function() {
              setIsProcessingPayment(false);
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment. Your order is saved as pending.",
              });
            }
          }
        };
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err: any) {
        setIsProcessingPayment(false);
        toast({
          title: "Payment Error",
          description: err.message || "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }
  };

  if (items.length === 0) {
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
            <h2 className="font-serif text-3xl mb-4 text-foreground">Cart is Empty</h2>
            <p className="text-muted-foreground mb-8">
              Add some products to your cart before checking out.
            </p>
            <Link 
              href="/products" 
              className="gold-button inline-flex items-center gap-3 px-10 py-4 rounded-xl uppercase tracking-wider text-sm"
            >
              Browse Products
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

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
            <Link 
              href="/cart" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:gold-text transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>
            <h1 className="font-serif text-5xl md:text-6xl mb-4">
              <span className="gold-gradient-text">Checkout</span>
            </h1>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Shipping Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="neo-card p-8 rounded-2xl"
                >
                  <h2 className="font-serif text-2xl mb-6 text-foreground">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="John Doe"
                        data-testid="input-customer-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="+91 98765 43210"
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-muted-foreground mb-2">Email (Optional)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="john@example.com"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="neo-card p-8 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-foreground">Shipping Address</h2>
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={isGettingLocation}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm gold-text hover:bg-primary/30 transition-colors disabled:opacity-50"
                      data-testid="button-use-location"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Use My Location
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Address *</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors resize-none"
                        placeholder="House No., Street, Landmark"
                        data-testid="input-address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="Mumbai"
                          data-testid="input-city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="Maharashtra"
                          data-testid="input-state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-secondary/50 border border-white/10 px-5 py-4 rounded-xl focus:outline-none focus:border-primary/50 transition-colors"
                          placeholder="400001"
                          data-testid="input-pincode"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="neo-card p-8 rounded-2xl"
                >
                  <h2 className="font-serif text-2xl mb-6 text-foreground">Payment Method</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => { setPaymentMethod("upi"); setUpiPaymentConfirmed(false); }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "upi"
                          ? "border-primary bg-primary/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                      data-testid="button-payment-upi"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMethod === "upi" ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Smartphone className={`w-6 h-6 ${paymentMethod === "upi" ? "gold-text" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">UPI Direct</p>
                          <p className="text-sm text-muted-foreground">GPay, PhonePe, Paytm</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "razorpay"
                          ? "border-primary bg-primary/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                      data-testid="button-payment-razorpay"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMethod === "razorpay" ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <Smartphone className={`w-6 h-6 ${paymentMethod === "razorpay" ? "gold-text" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Pay Online</p>
                          <p className="text-sm text-muted-foreground">Cards, NetBanking</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* UPI Direct Payment Section */}
                  {paymentMethod === "upi" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 p-6 rounded-xl bg-secondary/30 border border-white/5"
                    >
                      <div className="text-center">
                        <p className="text-lg font-semibold gold-text mb-2">Pay ₹{finalTotal.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground mb-4">Scan QR code or use UPI ID</p>
                        
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-xl inline-block mb-4">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${MERCHANT_UPI_ID}&pn=Luxe%20Candle&am=${finalTotal.toFixed(2)}&cu=INR`}
                            alt="UPI QR Code"
                            className="w-48 h-48"
                            data-testid="img-upi-qr"
                          />
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">Or pay using UPI ID:</p>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <code className="bg-primary/20 border border-primary/30 px-4 py-2 rounded-lg gold-text font-mono text-sm">
                            {MERCHANT_UPI_ID}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(MERCHANT_UPI_ID);
                              toast({ title: "Copied!", description: "UPI ID copied to clipboard" });
                            }}
                            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                            data-testid="button-copy-upi"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>

                        {/* Supported Apps */}
                        <div className="flex justify-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                              <span className="text-[#4285F4] font-bold text-xs">G</span>
                            </div>
                            <span className="text-xs">GPay</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-lg bg-[#5f259f] flex items-center justify-center">
                              <span className="text-white font-bold text-xs">P</span>
                            </div>
                            <span className="text-xs">PhonePe</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-lg bg-[#00baf2] flex items-center justify-center">
                              <span className="text-white font-bold text-xs">₹</span>
                            </div>
                            <span className="text-xs">Paytm</span>
                          </div>
                        </div>

                        {/* Payment Confirmation */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                          <label className="flex items-center justify-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={upiPaymentConfirmed}
                              onChange={(e) => setUpiPaymentConfirmed(e.target.checked)}
                              className="w-5 h-5 rounded border-primary/50 bg-secondary accent-primary"
                              data-testid="checkbox-upi-confirmed"
                            />
                            <span className="text-sm">I have completed the payment</span>
                          </label>
                          <p className="text-xs text-muted-foreground mt-2">
                            Check this box after making the payment to place your order
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Razorpay Payment Options */}
                  {paymentMethod === "razorpay" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 p-5 rounded-xl bg-secondary/30 border border-white/5"
                    >
                      <p className="text-sm text-muted-foreground mb-4">Pay securely with:</p>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="px-3 py-2 rounded-lg bg-white/10 text-sm">Credit/Debit Cards</div>
                        <div className="px-3 py-2 rounded-lg bg-white/10 text-sm">NetBanking</div>
                        <div className="px-3 py-2 rounded-lg bg-white/10 text-sm">Wallets</div>
                      </div>
                      {!razorpayConfig?.configured && (
                        <p className="text-xs text-yellow-500 mt-4">
                          Note: Online payment is being configured. Please use UPI Direct or Cash on Delivery for now.
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="neo-card p-8 rounded-2xl sticky top-32"
                >
                  <h2 className="font-serif text-2xl mb-6 text-foreground">Order Summary</h2>
                  
                  {/* Items */}
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.productId} className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm gold-text font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="premium-divider my-6" />

                  {/* Coupon Code Section */}
                  <div className="mb-6">
                    <label className="block text-sm text-muted-foreground mb-2">Have a coupon?</label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 gold-text" />
                          <span className="font-semibold gold-text">{appliedCoupon.code}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={removeCoupon}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-remove-coupon"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 bg-secondary/50 border border-white/10 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors uppercase"
                          data-testid="input-coupon-code"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-3 rounded-xl bg-primary/20 border border-primary/30 gold-text text-sm font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                          data-testid="button-apply-coupon"
                        >
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-foreground/80">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-foreground/80">
                      <div className="flex flex-col">
                        <span>Shipping</span>
                        <span className="text-xs text-muted-foreground">
                          {formData.city ? (shipping === 0 ? "(Free in Delhi - 30 min delivery!)" : "(₹45 outside Delhi)") : "(Free in Delhi)"}
                        </span>
                      </div>
                      <span className={shipping === 0 ? "gold-text font-semibold" : ""}>
                        {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    {shipping === 0 && formData.city && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                        <span className="text-green-400 text-sm font-medium">Express Delivery in Delhi - 30 Minutes!</span>
                      </div>
                    )}
                    <div className="premium-divider my-4" />
                    <div className="flex justify-between text-xl">
                      <span className="font-serif">Total</span>
                      <span className="gold-gradient-text font-bold">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrder.isPending || isProcessingPayment}
                    className="gold-button w-full inline-flex items-center justify-center gap-3 px-8 py-5 rounded-xl uppercase tracking-wider text-sm font-bold disabled:opacity-50"
                    data-testid="button-place-order"
                  >
                    {createOrder.isPending || isProcessingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isProcessingPayment ? "Processing Payment..." : "Processing..."}
                      </>
                    ) : (
                      <>
                        {paymentMethod === "razorpay" ? "Pay Now" : "Confirm & Place Order"}
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Secure & encrypted checkout
                  </p>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
