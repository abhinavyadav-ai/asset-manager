/**
 * Upload image to Cloudinary using unsigned upload (no API key/secret needed).
 * Cloud name and upload preset are hardcoded — zero env vars required.
 */

const CLOUD_NAME = "dm2qmwec5";
const UPLOAD_PRESET = "ml_default";

export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "products");

  console.log(`[Cloudinary] Uploading (unsigned, preset=${UPLOAD_PRESET}) to ${endpoint}`);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json();

  if (!response.ok) {
    console.error("[Cloudinary] API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Cloudinary upload failed (HTTP ${response.status})`);
  }

  console.log(`[Cloudinary] Upload success: ${data.secure_url}`);
  return data.secure_url;
}
