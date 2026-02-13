import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Header */}
      <div className="pt-32 pb-20 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 neo-glass rounded-full text-xs uppercase tracking-[0.2em] text-foreground/80 mb-6">
              <Sparkles className="w-3 h-3 gold-text" />
              Premium Selection
            </span>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6">
              The <span className="gold-gradient-text">Collection</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Discover our full range of artisanal scents, handcrafted to elevate your space.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-grow py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin gold-text" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="neo-card inline-block p-12 rounded-lg">
              <Sparkles className="w-12 h-12 gold-text mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No products found.</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
