import { v2 as cloudinary } from "cloudinary";

// Support both CLOUDINARY_URL (single env var) and individual vars
// CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    // Cloudinary auto-reads CLOUDINARY_URL from process.env
    // Just need to trigger config
    cloudinary.config(true);
    console.log("Cloudinary configured via CLOUDINARY_URL");
  } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured via individual env vars");
  } else {
    console.error("Cloudinary NOT configured - set CLOUDINARY_URL or individual vars");
  }
}

export { cloudinary, configureCloudinary };
