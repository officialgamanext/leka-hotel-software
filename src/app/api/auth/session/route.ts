import { NextRequest, NextResponse } from "next/server";
import { adminAuth, isAdminConfigured } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID Token" }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    let sessionCookie = "demo_session_cookie_token_value_xyz";

    if (isAdminConfigured && adminAuth) {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    } else {
      console.warn("Using Demo Mode session token. Admin SDK not configured.");
    }

    const response = NextResponse.json({ status: "success" }, { status: 200 });

    response.cookies.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({ status: "success" }, { status: 200 });
    
    response.cookies.set("session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Session clear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
