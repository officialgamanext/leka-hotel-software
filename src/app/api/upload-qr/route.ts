import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// File system fallback to load keys directly from .env file if process.env is stale
function getEnvVal(key: string): string | undefined {
  if (process.env[key]) {
    const val = process.env[key]?.trim();
    if (val && val !== "") {
      return val;
    }
  }
  
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const firstEqual = trimmed.indexOf("=");
          const k = trimmed.substring(0, firstEqual).trim();
          const v = trimmed.substring(firstEqual + 1).trim();
          if (k === key) {
            // Remove wrapping quotes if present
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              return v.substring(1, v.length - 1).trim();
            }
            return v;
          }
        }
      }
    }
  } catch (err) {
    console.error("FS Env Load Error:", err);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { roomNumber, businessId } = await req.json();
    if (!roomNumber || !businessId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const origin = req.nextUrl.origin;
    const scanUrl = `${origin}/raise-request?hotelId=${businessId}&roomNumber=${roomNumber}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;

    // Fetch raw image from api.qrserver.com
    const qrResponse = await fetch(qrUrl);
    if (!qrResponse.ok) {
      throw new Error("Failed to fetch QR code from qrserver");
    }

    const arrayBuffer = await qrResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    const cloudName = getEnvVal("CLOUDINARY_CLOUD_NAME");
    const apiKey = getEnvVal("CLOUDINARY_API_KEY");
    const apiSecret = getEnvVal("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary credentials missing in env configurations" }, { status: 500 });
    }

    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    // Upload to Cloudinary with private type option
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      {
        folder: `leka-hotel-qrs/${businessId}`,
        public_id: `Room_${roomNumber}_QR`,
        type: "private",
        resource_type: "image",
        overwrite: true
      }
    );

    // Generate a secure signed URL with 10 years validity
    const signedUrl = cloudinary.url(uploadResult.public_id, {
      type: "private",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
    });

    return NextResponse.json({ url: signedUrl });

  } catch (error: any) {
    console.error("Error in upload-qr API route using Cloudinary:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
