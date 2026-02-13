import { useProduct, useProducts } from "@/hooks/use-products";
import { Navbar, Footer } from "@/components/layout";
import { useCart } from "@/contexts/cart-context";
import { useRoute, Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, ShoppingBag, Minus, Plus, Sparkles, Clock, Leaf, Check, Heart, Star, Send, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { WishlistButton } from "@/components/wishlist-button";
import { SocialShare } from "@/components/social-share";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Review, Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { data: allProducts } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Reviews state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Fetch approved reviews for this product
  const { data: reviews } = useQuery<Review[]>({
    queryKey: ['/api/products', id, 'reviews'],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: id > 0,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { productId: number; customerName: string; email: string; rating: number; comment?: string }) => {
      await apiRequest('POST', '/api/reviews', data);
    },
    onSuccess: () => {
      toast({ title: "Review submitted!", description: "Your review will be visible after approval." });
      setShowReviewForm(false);
      setReviewName('');
      setReviewEmail('');
      setReviewRating(5);
      setReviewComment('');
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmitReview = () => {
    if (!reviewName || !reviewEmail) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }
    submitReviewMutation.mutate({
      productId: id,
      customerName: reviewName,
      email: reviewEmail,
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
  };

  // Related products (same category, excluding current product)
  const relatedProducts = allProducts?.filter(
    (p) => p.id !== id && p.category === product?.category
  ).slice(0, 4) || [];

  // Calculate average rating
  const avgRating = reviews?.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] || "https://images.unsplash.com/photo-1602825266977-148c3b4d241d?w=800&q=80",
    });
    
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] || "https://images.unsplash.com/photo-1602825266977-148c3b4d241d?w=800&q=80",
    });
    
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col noise-texture">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin gold-text" />
            <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col noise-texture">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <p className="text-xl text-muted-foreground">Product not found</p>
          <Link href="/products" className="gold-text hover:opacity-80 transition-opacity">Back to Shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1602825266977-148c3b4d241d?w=800&q=80"];
  const inStock = (product.stock ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col noise-texture">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:gold-text mb-10 transition-colors group"
          data-testid="link-back-collection"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="aspect-square neo-card rounded-2xl overflow-hidden relative glow-ring">
              <motion.img 
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={images[activeImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {/* Floating Price Badge */}
              <div className="absolute top-6 right-6 glass-card px-5 py-3 rounded-full">
                <span className="gold-gradient-text text-xl font-bold">₹{product.price.toFixed(2)}</span>
              </div>
              
              {/* Stock Badge */}
              <div className={`absolute top-6 left-6 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-bold ${
                inStock ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {inStock ? `In Stock (${product.stock})` : "Out of Stock"}
              </div>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl transition-all ${
                      idx === activeImageIndex 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                        : "opacity-60 hover:opacity-100 neo-card"
                    }`}
                    data-testid={`button-thumbnail-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            <span className="gold-text text-xs uppercase tracking-[0.25em] font-bold mb-4">
              {product.category || "Premium Collection"}
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">{product.name}</h1>
            <p className="text-3xl font-light gold-gradient-text mb-8">₹{product.price.toFixed(2)}</p>
            
            <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
              {product.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Clock, label: "40-50 hrs" },
                { icon: Leaf, label: "Natural" },
                { icon: Sparkles, label: "Premium" },
              ].map((item) => (
                <div key={item.label} className="neo-card p-4 rounded-xl text-center">
                  <item.icon className="w-5 h-5 gold-text mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="premium-divider my-6" />

            {/* Quantity Selector */}
            <div className="flex items-center gap-6 mb-8">
              <span className="text-sm uppercase tracking-wider font-medium text-foreground">Quantity</span>
              <div className="flex items-center neo-card rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-4 hover:bg-white/5 transition-colors"
                  data-testid="button-quantity-decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center text-lg font-medium" data-testid="text-quantity">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-4 hover:bg-white/5 transition-colors"
                  data-testid="button-quantity-increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-muted-foreground">
                Total: <span className="gold-text font-semibold">₹{(product.price * quantity).toFixed(2)}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button 
                onClick={handleAddToCart}
                disabled={!inStock}
                className="gold-button w-full flex items-center justify-center gap-3 py-5 rounded-xl uppercase tracking-widest text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-add-to-cart"
              >
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.div
                      key="added"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Added to Cart!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              
              <button 
                onClick={handleBuyNow}
                disabled={!inStock}
                className="gold-outline-button w-full flex items-center justify-center gap-3 py-5 rounded-xl uppercase tracking-widest text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-buy-now"
              >
                Buy Now
              </button>

              {/* Wishlist & Share */}
              <div className="flex items-center gap-4 pt-2">
                <WishlistButton productId={product.id} size="lg" className="flex-shrink-0" />
                <SocialShare title={product.name} price={product.price} />
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Free shipping on orders over ₹75
            </p>

            {/* Additional Details */}
            <div className="mt-12 space-y-4">
              <div className="neo-card p-6 rounded-xl">
                <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 gold-text" />
                  Fragrance Notes
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="block text-xs uppercase tracking-wider gold-text mb-1">Top</span>
                    Bergamot, Lemon
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider gold-text mb-1">Middle</span>
                    Jasmine, Lavender
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider gold-text mb-1">Base</span>
                    Sandalwood, Vanilla
                  </div>
                </div>
              </div>
              
              <div className="neo-card p-6 rounded-xl">
                <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
                  <Leaf className="w-4 h-4 gold-text" />
                  Product Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Burn Time</span>
                    <span className="text-foreground">40-50 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wax Type</span>
                    <span className="text-foreground">100% Soy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wick</span>
                    <span className="text-foreground">Cotton Lead-free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight</span>
                    <span className="text-foreground">8 oz / 227g</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-3xl">Customer Reviews</h2>
              {avgRating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(parseFloat(avgRating)) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium gold-text">{avgRating}</span>
                  <span className="text-muted-foreground">({reviews?.length} reviews)</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="gold-outline-button px-6 py-2 rounded-lg text-sm font-medium"
              data-testid="button-write-review"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="neo-card p-6 rounded-xl mb-8 overflow-hidden"
              >
                <h3 className="font-medium text-lg mb-4">Share Your Experience</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Your Name *</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none transition-colors"
                      data-testid="input-review-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none transition-colors"
                      data-testid="input-review-email"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                        data-testid={`button-rating-${star}`}
                      >
                        <Star
                          className={`w-8 h-8 ${star <= reviewRating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-600'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-1 block">Your Review</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-lg focus:border-[#F5A623] focus:outline-none transition-colors resize-none"
                    data-testid="input-review-comment"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                    className="gold-button flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
                    data-testid="button-submit-review"
                  >
                    {submitReviewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Review
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews List */}
          <div className="space-y-4">
            {!reviews || reviews.length === 0 ? (
              <div className="neo-card p-12 rounded-xl text-center">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="neo-card p-6 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#F5A623]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{review.customerName}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-3xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct.id} href={`/products/${relProduct.id}`}>
                  <div className="neo-card rounded-xl overflow-hidden group cursor-pointer">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={relProduct.images?.[0] || 'https://images.unsplash.com/photo-1602825266977-148c3b4d241d?w=800&q=80'}
                        alt={relProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm truncate">{relProduct.name}</h3>
                      <p className="gold-text font-semibold mt-1">₹{relProduct.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
