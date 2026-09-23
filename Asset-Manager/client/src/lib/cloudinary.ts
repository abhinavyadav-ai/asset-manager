/**
 * Cloudinary image optimization utilities.
 * Applies f_auto, q_auto, and responsive width transformations
 * to Cloudinary URLs for faster loading.
 */

const CLOUDINARY_BASE = "res.cloudinary.com";

interface CloudinaryOptions {
  /** Target display width in pixels */
  width?: number;
  /** Image quality: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' | number */
  quality?: string;
  /** Crop mode */
  crop?: "fill" | "fit" | "limit" | "scale" | "thumb";
  /** Target display height in pixels */
  height?: number;
  /** Device pixel ratio multiplier (default: auto based on window.devicePixelRatio) */
  dpr?: number;
}

/**
 * Transform a Cloudinary URL to include optimization parameters.
 * Non-Cloudinary URLs are returned unchanged.
 *
 * @example
 * getOptimizedUrl("https://res.cloudinary.com/dm2qmwec5/image/upload/v123/products/candle.jpg", { width: 300 })
 * // → "https://res.cloudinary.com/dm2qmwec5/image/upload/f_auto,q_auto,w_300,c_fill/v123/products/candle.jpg"
 */
export function getOptimizedUrl(
  url: string,
  options: CloudinaryOptions = {}
): string {
  if (!url || !url.includes(CLOUDINARY_BASE)) {
    return url; // Not a Cloudinary URL — return as-is
  }

  const { width, height, quality = "auto", crop = "fill", dpr } = options;

  // Build transformation string
  const transforms: string[] = ["f_auto", `q_${quality}`];

  if (width) {
    transforms.push(`w_${width}`);
  }
  if (height) {
    transforms.push(`h_${height}`);
  }
  if (width || height) {
    transforms.push(`c_${crop}`);
  }
  if (dpr && dpr > 1) {
    transforms.push(`dpr_${dpr}`);
  }

  const transformString = transforms.join(",");

  // Insert transformations after /upload/ in the URL
  // Pattern: .../image/upload/[existing_transforms/]v1234/...
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return url;

  const before = url.substring(0, uploadIndex + "/upload/".length);
  const after = url.substring(uploadIndex + "/upload/".length);

  // Remove any existing transformation segment (starts with f_, q_, w_, etc.)
  // Cloudinary transforms are before the version (v1234) or public_id
  const afterClean = after.replace(
    /^(?:(?:f_|q_|w_|h_|c_|dpr_|e_|g_|l_|o_|r_|t_|x_|y_)[^/]+\/?)+/,
    ""
  );

  return `${before}${transformString}/${afterClean}`;
}

/**
 * Preset widths for common usage patterns.
 */
export const IMAGE_WIDTHS = {
  /** Product card in grid (compact) */
  CARD_COMPACT: 400,
  /** Product card full size */
  CARD_FULL: 600,
  /** Product detail main image */
  DETAIL_MAIN: 800,
  /** Thumbnail images */
  THUMBNAIL: 100,
  /** Order confirmation item */
  ORDER_ITEM: 80,
  /** Hero / banner images */
  HERO: 1920,
  /** Navigation card images */
  NAV_CARD: 600,
} as const;
