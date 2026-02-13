import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || "luxe-candle",
        public_id: options?.publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error("No result from Cloudinary"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export { cloudinary };
