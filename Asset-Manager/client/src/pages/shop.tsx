import { Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { Loader2, Sparkles, Filter, Grid, LayoutGrid, Search, X, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";

const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: '₹10 - ₹1,000', min: 10, max: 1000 },
  { label: 'Under ₹500', min: 0, max: 499 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
  { label: 'Above ₹2,000', min: 2000, max: Infinity },
];

export default function ShopPage() {
  const { data: products, isLoading } = useProducts();
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid');
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const urlSearchQuery = new URLSearchParams(searchParams).get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const priceFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Close price filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priceFilterRef.current && !priceFilterRef.current.contains(event.target as Node)) {
        setShowPriceFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products?.filter(product => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Price filter
    const priceRange = priceRanges[selectedPriceRange];
    const price = Number(product.price);
    if (price < priceRange.min || price > priceRange.max) return false;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Premium Hero Header */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="inline-flex items-center gap-3 px-5 py-2.5 glass-card rounded-full text-xs uppercase tracking-[0.25em] text-white/80 font-medium mb-8">
              <Sparkles className="w-4 h-4 gold-text" />
              Premium Selection
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-[0.95]">
              The <span className="gold-gradient-text font-semibold" style={{ textShadow: '0 0 40px rgba(245, 166, 35, 0.3)' }}>Collection</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto text-lg font-light">
              Discover our curated selection of handcrafted luxury candles, each one a masterpiece of scent and ambiance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="px-6 py-4 border-y border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredProducts?.length || 0} of {products?.length || 0} Products
              </span>
            </div>
            
            {/* Price Filter Dropdown */}
            <div className="relative" ref={priceFilterRef}>
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedPriceRange > 0 
                    ? 'neo-card gold-text border border-primary/30' 
                    : 'neo-card text-white/70 hover:text-white'
                }`}
                data-testid="button-price-filter"
              >
                <span>{priceRanges[selectedPriceRange].label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPriceFilter ? 'rotate-180' : ''}`} />
              </button>
              
              {showPriceFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-48 neo-card rounded-xl overflow-hidden z-50 border border-border/50"
                >
                  {priceRanges.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPriceRange(index);
                        setShowPriceFilter(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        selectedPriceRange === index
                          ? 'gold-text bg-primary/10'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-price-range-${index}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            
            {/* Clear Filters */}
            {(selectedPriceRange > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedPriceRange(0);
                  setSearchQuery('');
                  navigate('/shop');
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
                data-testid="button-clear-all-filters"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'neo-card gold-text' : 'text-muted-foreground hover:text-white'}`}
              data-testid="button-view-grid"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('large')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'large' ? 'neo-card gold-text' : 'text-muted-foreground hover:text-white'}`}
              data-testid="button-view-large"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="flex-grow py-16 max-w-7xl mx-auto px-6 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin gold-text" />
              <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Loading premium collection...</p>
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <>
            {searchQuery && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 flex items-center gap-3"
              >
                <span className="text-white/60">Showing results for:</span>
                <span className="px-4 py-2 neo-card rounded-full text-white font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 gold-text" />
                  "{searchQuery}"
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      navigate('/shop');
                    }}
                    className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    data-testid="button-clear-search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
                <span className="text-white/40">({filteredProducts.length} products)</span>
              </motion.div>
            )}
            <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </>
        ) : searchQuery ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Search className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="font-serif text-2xl text-white mb-3">No results for "{searchQuery}"</h3>
            <p className="text-muted-foreground mb-6">Try searching with different keywords</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                navigate('/shop');
              }}
              className="gold-button px-6 py-3 rounded-xl font-bold"
              data-testid="button-view-all-products"
            >
              View All Products
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Sparkles className="w-10 h-10 gold-text" />
            </div>
            <h3 className="font-serif text-2xl text-white mb-3">Collection Coming Soon</h3>
            <p className="text-muted-foreground">Our artisans are crafting something special for you.</p>
          </motion.div>
        )}
      </main>

      {/* Bottom CTA */}
      <section className="py-16 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-serif text-3xl text-white mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-muted-foreground mb-8">
              Contact us for custom orders and personalized recommendations.
            </p>
            <a 
              href="https://wa.me/919279547350?text=Hi! I need help finding the perfect candle"
              target="_blank"
              rel="noopener noreferrer"
              className="gold-button inline-flex items-center gap-3 px-8 py-4 rounded-full uppercase tracking-widest text-sm font-bold"
              data-testid="button-whatsapp-help"
            >
              Get Personalized Help
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
