import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { Chatbot } from "@/components/chatbot";
import { BackToTop } from "@/components/back-to-top";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for faster initial load
const Home = lazy(() => import("@/pages/home"));
const ShopPage = lazy(() => import("@/pages/shop"));
const ProductsPage = lazy(() => import("@/pages/products"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail"));
const CartPage = lazy(() => import("@/pages/cart"));
const CheckoutPage = lazy(() => import("@/pages/checkout"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const LoginPage = lazy(() => import("@/pages/login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const ContactPage = lazy(() => import("@/pages/contact"));
const AboutPage = lazy(() => import("@/pages/about"));
const WishlistPage = lazy(() => import("@/pages/wishlist"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Minimal loading spinner
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#F5A623] animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/products/:id" component={ProductDetailPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />
        <Route path="/login" component={LoginPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router />
            <Chatbot />
            <BackToTop />
            <Toaster />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
