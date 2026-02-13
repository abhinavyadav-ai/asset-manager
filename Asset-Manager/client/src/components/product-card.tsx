import { Link } from "wouter";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import { type Product } from "@shared/schema";
import { motion } from "framer-motion";
import { WishlistButton } from "./wishlist-button";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const displayImage = product.images?.[0] || "https://images.unsplash.com/photo-1602825266977-148c3b4d241d?w=800&q=80";

  if (compact) {
    return (
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.25, type: "spring", stiffness: 400 }}
        className="group relative flex flex-col neo-card rounded-xl overflow-hidden hover-shine" 
        data-testid={`card-product-${product.id}`}
      >
        <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-square bg-secondary">
          <img 
            src={displayImage} 
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 right-3 glass-card px-3 py-1 rounded-full">
            <span className="gold-gradient-text text-sm font-bold">₹{product.price.toFixed(0)}</span>
          </div>
          <div className="absolute top-3 left-3">
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </Link>
        <div className="p-4">
          <h3 className="font-serif text-base text-foreground group-hover:gold-text transition-colors mb-1 line-clamp-1">
            <Link href={`/products/${product.id}`} data-testid={`link-product-${product.id}`}>
              {product.name}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
          <Link 
            href={`/products/${product.id}`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold gold-text"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      className="group relative flex flex-col neo-card rounded-2xl overflow-hidden glow-ring hover-shine" 
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/products/${product.id}`} className="block relative overflow-hidden aspect-[4/5] bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 z-10 transition-all duration-500" />
        <img 
          src={displayImage} 
          alt={product.name}
          className="w-full h-full object-cover object-center image-hover-zoom"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
          <div className="glass-card p-5 rounded-xl text-center flex items-center justify-center gap-3">
            <Eye className="w-5 h-5 gold-text" />
            <span className="text-sm uppercase tracking-widest font-semibold text-foreground">
              View Details
            </span>
          </div>
        </div>
        <div className="absolute top-5 right-5 glass-card px-4 py-2 rounded-full">
          <span className="gold-gradient-text text-lg font-bold">₹{product.price.toFixed(2)}</span>
        </div>
        <div className="absolute top-5 left-5 z-30">
          <WishlistButton productId={product.id} size="md" />
        </div>
      </Link>

      <div className="p-7">
        <h3 className="font-serif text-2xl text-foreground group-hover:gold-text transition-colors duration-500 mb-3">
          <Link href={`/products/${product.id}`} data-testid={`link-product-${product.id}`}>
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
          {product.description}
        </p>
        <Link 
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-3 text-sm uppercase tracking-wider font-bold gold-text hover:gap-4 transition-all group/link"
        >
          Shop Now 
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
