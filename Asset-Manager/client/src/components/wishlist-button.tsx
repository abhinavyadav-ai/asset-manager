import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/contexts/wishlist-context";

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WishlistButton({ productId, className = "", size = "md" }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${className}`}
      style={{
        background: isWishlisted 
          ? "linear-gradient(135deg, #F5A623, #d4920f)" 
          : "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
      }}
      data-testid={`button-wishlist-${productId}`}
    >
      <motion.div
        initial={false}
        animate={{ scale: isWishlisted ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`${iconSizes[size]} ${isWishlisted ? "text-black fill-black" : "text-white"}`} 
        />
      </motion.div>
    </motion.button>
  );
}
