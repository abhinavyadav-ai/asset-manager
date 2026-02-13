import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/contexts/wishlist-context";
import { useProducts } from "@/hooks/use-products";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { data: allProducts, isLoading } = useProducts();

  const wishlistProducts = allProducts?.filter((product) =>
    wishlist.includes(product.id)
  ) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="inline-flex items-center gap-3 px-5 py-2.5 glass-card rounded-full text-xs uppercase tracking-[0.25em] text-white/80 font-medium mb-8">
              <Heart className="w-4 h-4 gold-text" />
              My Wishlist
            </span>
            <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 leading-[0.95]">
              Your <span className="gold-gradient-text font-semibold">Favorites</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto text-lg font-light">
              {wishlistProducts.length > 0
                ? `You have ${wishlistProducts.length} item${wishlistProducts.length > 1 ? "s" : ""} saved for later`
                : "Save your favorite candles to revisit them anytime"}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="flex-grow py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <ProductCard product={product} compact />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Heart className="w-12 h-12 text-white/30" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-3">Your wishlist is empty</h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Start adding your favorite candles by clicking the heart icon on any product
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 gold-button px-8 py-4 rounded-full text-sm uppercase tracking-wider font-bold"
                data-testid="link-browse-products"
              >
                <ShoppingBag className="w-5 h-5" />
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
