import crypto from "crypto";

/**
 * Upload image to Cloudinary using REST API directly (no SDK needed).
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary not configured. CLOUD_NAME=${cloudName ? "SET" : "MISSING"}, API_KEY=${apiKey ? "SET" : "MISSING"}, API_SECRET=${apiSecret ? "SET" : "MISSING"}`
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "products";

  // Generate signature: alphabetically sorted params + api_secret
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  // Build multipart form data (Cloudinary requires multipart/form-data)
  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  console.log(`Cloudinary upload: cloud=${cloudName}, key=${apiKey.slice(0, 4)}***, folder=${folder}`);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cloudinary API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
}
