import { createHash } from "crypto";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary signed upload configuration is missing");
  }
  return { cloudName, apiKey, apiSecret };
}

export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=products&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", "products");

  console.log(`[Cloudinary] Uploading signed image to ${new URL(endpoint).origin}`);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok) {
    console.error("[Cloudinary] API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`);
  }

  console.log(`[Cloudinary] Upload success: ${data.secure_url}`);
  return data.secure_url;
}
