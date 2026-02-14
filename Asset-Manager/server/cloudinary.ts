import crypto from "crypto";

/**
 * Parse Cloudinary credentials from CLOUDINARY_URL or individual env vars.
 * CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 */
function getCredentials(): { cloudName: string; apiKey: string; apiSecret: string } {
  // Method 1: CLOUDINARY_URL (single env var from Cloudinary dashboard — most reliable)
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;
      console.log(`Cloudinary config from CLOUDINARY_URL: cloud=${cloudName.trim()}, key=${apiKey.slice(0, 4)}***`);
      return { cloudName: cloudName.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };
    }
    throw new Error(`Invalid CLOUDINARY_URL format. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME`);
  }

  // Method 2: Individual env vars
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary not configured. Set CLOUDINARY_URL or all three: CLOUD_NAME=${cloudName ? "SET" : "MISSING"}, API_KEY=${apiKey ? "SET" : "MISSING"}, API_SECRET=${apiSecret ? "SET" : "MISSING"}`
    );
  }

  console.log(`Cloudinary config from env vars: cloud=${cloudName}, key=${apiKey.slice(0, 4)}***`);
  return { cloudName, apiKey, apiSecret };
}

/**
 * Upload image to Cloudinary using REST API directly (no SDK).
 * Supports CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
 */
export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getCredentials();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "products";

  // Signature: sorted params string + api_secret, hashed with SHA-1
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  console.log(`Cloudinary uploading to: ${endpoint}`);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok) {
    console.error("Cloudinary API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`);
  }

  console.log(`Cloudinary upload success: ${data.secure_url}`);
  return data.secure_url;
}
