import crypto from "crypto";

/**
 * Parse Cloudinary credentials.
 *
 * Supports 3 methods (checked in order):
 *   1. CLOUDINARY_URL  — cloudinary://KEY:SECRET@CLOUD_NAME
 *   2. Individual vars — CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *   3. Unsigned upload — CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET (no secret needed!)
 */
interface SignedCreds   { mode: "signed";   cloudName: string; apiKey: string; apiSecret: string }
interface UnsignedCreds { mode: "unsigned"; cloudName: string; uploadPreset: string }
type Creds = SignedCreds | UnsignedCreds;

function getCredentials(): Creds {
  // --- Method 1: CLOUDINARY_URL ---
  const cloudinaryUrl = (process.env.CLOUDINARY_URL || "").trim();
  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;
      console.log(`[Cloudinary] Config from CLOUDINARY_URL: cloud=${cloudName.trim()}`);
      return { mode: "signed", cloudName: cloudName.trim(), apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };
    }
    throw new Error("Invalid CLOUDINARY_URL format. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME");
  }

  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();

  // --- Method 2: Signed upload (individual vars) ---
  const apiKey    = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (cloudName && apiKey && apiSecret) {
    console.log(`[Cloudinary] Config from individual env vars (signed): cloud=${cloudName}`);
    return { mode: "signed", cloudName, apiKey, apiSecret };
  }

  // --- Method 3: Unsigned upload (only cloud name + preset) ---
  const uploadPreset = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  if (cloudName && uploadPreset) {
    console.log(`[Cloudinary] Config from env vars (unsigned preset=${uploadPreset}): cloud=${cloudName}`);
    return { mode: "unsigned", cloudName, uploadPreset };
  }

  // Nothing configured — give detailed error
  throw new Error(
    `[Cloudinary] NOT CONFIGURED! Set one of:\n` +
    `  1) CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD_NAME\n` +
    `  2) CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET\n` +
    `  3) CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET (unsigned)\n` +
    `Currently: CLOUD_NAME=${cloudName || "MISSING"}, API_KEY=${apiKey || "MISSING"}, ` +
    `API_SECRET=${apiSecret ? "SET" : "MISSING"}, UPLOAD_PRESET=${uploadPreset || "MISSING"}`
  );
}

/**
 * Upload image to Cloudinary using REST API directly (no SDK).
 */
export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const creds = getCredentials();
  const endpoint = `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", base64Data);

  if (creds.mode === "signed") {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "products";
    const toSign = `folder=${folder}&timestamp=${timestamp}${creds.apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    formData.append("api_key", creds.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
  } else {
    // Unsigned upload — just the preset name
    formData.append("upload_preset", creds.uploadPreset);
    formData.append("folder", "products");
  }

  console.log(`[Cloudinary] Uploading (${creds.mode}) to: ${endpoint}`);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok) {
    console.error("[Cloudinary] API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`);
  }

  console.log(`[Cloudinary] Upload success: ${data.secure_url}`);
  return data.secure_url;
}
