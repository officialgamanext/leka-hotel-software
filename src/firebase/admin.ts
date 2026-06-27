import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const isAdminConfigured = !!(serviceAccountKey || (projectId && clientEmail && privateKey));

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

if (isAdminConfigured) {
  const initAdmin = () => {
    if (getApps().length > 0) {
      return getApp();
    }

    if (serviceAccountKey) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        return initializeApp({
          credential: cert(parsedKey),
          projectId: parsedKey.project_id,
        });
      } catch (error) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", error);
      }
    }

    if (projectId && clientEmail && privateKey) {
      const formattedKey = privateKey.replace(/\\n/g, "\n");
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
        projectId,
      });
    }

    return initializeApp({
      projectId: projectId || undefined,
    });
  };

  try {
    adminApp = initAdmin();
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (err) {
    console.error("Firebase Admin SDK failed to initialize:", err);
  }
} else {
  if (typeof window === "undefined") {
    console.warn(
      "Firebase Admin SDK is running in DEMO MODE. Configure service account environment variables for production security."
    );
  }
}

export { adminApp, adminAuth, adminDb, isAdminConfigured };
