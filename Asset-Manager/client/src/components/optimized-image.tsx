import { useState, useCallback, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  /** Source URL (Cloudinary URLs auto-optimized with f_auto, q_auto) */
  src: string;
  alt: string;
  /** Target display width for Cloudinary optimization */
  optimizedWidth?: number;
  /** Target display height for Cloudinary optimization */
  optimizedHeight?: number;
  /** Wrapper className (for skeleton + image container) */
  containerClassName?: string;
  /** Show skeleton loader while image loads (default: true) */
  showSkeleton?: boolean;
  /** Aspect ratio class for skeleton (e.g., 'aspect-square', 'aspect-[4/5]') */
  aspectRatio?: string;
}

export function OptimizedImage({
  src,
  alt,
  optimizedWidth,
  optimizedHeight,
  className,
  containerClassName,
  showSkeleton = true,
  aspectRatio,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => setIsLoaded(true), []);
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true); // Stop showing skeleton on error
  }, []);

  const optimizedSrc = getOptimizedUrl(src, {
    width: optimizedWidth,
    height: optimizedHeight,
  });
  const resolvedSrc = optimizedSrc.startsWith("/")
    ? `${window.location.origin}${optimizedSrc}`
    : optimizedSrc;

  // Generate srcSet for responsive Cloudinary images
  const srcSet = src.includes("res.cloudinary.com") && optimizedWidth
    ? [
        `${getOptimizedUrl(src, { width: optimizedWidth })} 1x`,
        `${getOptimizedUrl(src, { width: optimizedWidth * 2 })} 2x`,
      ].join(", ")
    : undefined;

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-xs",
          containerClassName || className,
          aspectRatio
        )}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName, aspectRatio)}>
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full z-10" />
      )}

      <img
        src={resolvedSrc}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
