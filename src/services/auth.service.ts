import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collectionGroup, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  collection
} from "firebase/firestore";
import { Staff } from "@/types";
import { demoDb } from "./demoDb";

// Mock memory store for demo mode
const DEMO_STAFF_PROFILES: Staff[] = [
  {
    uid: "demo-user-id",
    name: "Admin",
    email: "admin@lekahotel.com",
    role: "owner",
    businessId: "demo-hotel-id",
    active: true,
    createdAt: new Date().toISOString(),
  }
];

export const authService = {
  /**
   * Log in user, write/sync their user document in Firestore on login,
   * and set secure session cookie.
   */
  async login(email: string, pass: string): Promise<any> {
    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (email === "admin@lekahotel.com" && pass === "admin123") {
        const demoUser = {
          uid: "demo-user-id",
          email: "admin@lekahotel.com",
          displayName: "Admin",
          getIdToken: async () => "demo-id-token-abc-123",
        };

        // Sync demo profile
        // In demo mode, we just ensure it returns successfully
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "demo-id-token" }),
        });

        return demoUser;
      } else {
        // Allow mock staff member logins in demo mode
        const allStaff = demoDb.getStaff();
        const matchedStaff = allStaff.find((s) => s.email === email && s.password === pass && s.active);
        
        if (matchedStaff) {
          const demoUser = {
            uid: matchedStaff.uid,
            email: matchedStaff.email,
            displayName: matchedStaff.name,
            getIdToken: async () => `demo-id-token-${matchedStaff.uid}`,
          };

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: `demo-id-token-${matchedStaff.uid}` }),
          });

          return demoUser;
        }

        throw new Error("Invalid credentials. Use admin@lekahotel.com / admin123 or registered staff email & password.");
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // RULE: On login, user will be created/synced in Firestore under 'users/{uid}'
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
        createdAt: new Date().toISOString(),
      });
    }

    const idToken = await user.getIdToken();

    // Create secure HTTP-only cookie
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to establish secure session cookie.");
    }

    return user;
  },

  /**
   * Log out user.
   */
  async logout(): Promise<void> {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
  },

  /**
   * Register user.
   */
  async register(email: string, pass: string): Promise<any> {
    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        uid: `demo-user-${Math.random().toString(36).substring(2, 9)}`,
        email,
        displayName: "Admin",
        getIdToken: async () => "demo-id-token-new",
      };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  /**
   * Check which businesses a user is associated with.
   */
  async getUserStaffProfiles(email: string): Promise<Staff[]> {
    if (!isFirebaseConfigured) {
      const allStaff = demoDb.getStaff();
      // Combine DEMO_STAFF_PROFILES and demoDb.getStaff()
      const combined = [...DEMO_STAFF_PROFILES];
      allStaff.forEach((s) => {
        if (!combined.some((c) => c.uid === s.uid)) {
          combined.push(s);
        }
      });
      return combined.filter((s) => s.email === email && s.active);
    }

    const staffQuery = query(
      collectionGroup(db, "staff"),
      where("email", "==", email),
      where("active", "==", true)
    );
    
    const snapshot = await getDocs(staffQuery);
    const profiles: Staff[] = [];
    
    snapshot.forEach((docSnap) => {
      profiles.push(docSnap.data() as Staff);
    });
    
    return profiles;
  }
};
