import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, email, password, name, mobileNumber, role, permissions } = body;

    if (!businessId || !email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    // Dynamic import to prevent crash at module evaluation time
    const { adminAuth, adminDb, isAdminConfigured } = await import("@/firebase/admin");

    if (!isAdminConfigured || !adminAuth || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 500 });
    }

    // 1. Create the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (authErr: any) {
      console.error("Auth creation failed:", authErr);
      return NextResponse.json({ error: authErr.message || "Failed to create Auth account." }, { status: 400 });
    }

    const uid = userRecord.uid;
    const createdAt = new Date().toISOString();

    // 2. Save the staff profile in Firestore under businesses/{businessId}/staff/{uid}
    const staffDocRef = adminDb.doc(`businesses/${businessId}/staff/${uid}`);
    const staffData = {
      uid,
      name,
      email,
      mobileNumber: mobileNumber || "",
      role,
      businessId,
      active: true,
      createdAt,
      permissions
    };

    try {
      await staffDocRef.set(staffData);
    } catch (dbErr: any) {
      console.error("Firestore staff save failed:", dbErr);
      // Clean up the auth user since database save failed
      try {
        await adminAuth.deleteUser(uid);
      } catch (cleanupErr) {
        console.error("Cleanup deletion failed:", cleanupErr);
      }
      return NextResponse.json({ error: dbErr.message || "Failed to save staff profile in database." }, { status: 500 });
    }

    return NextResponse.json({ status: "success", staff: staffData }, { status: 200 });
  } catch (error: any) {
    console.error("Staff creation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
