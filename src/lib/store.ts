import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Business, Staff } from "@/types";

interface AppState {
  selectedBusinessId: string | null;
  businesses: Business[];
  currentStaff: Staff | null;
  theme: "light" | "dark";
  setSelectedBusinessId: (id: string | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  setCurrentStaff: (staff: Staff | null) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedBusinessId: null,
      businesses: [],
      currentStaff: null,
      theme: "dark", // default to elegant dark theme for premium aesthetic
      setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
      setBusinesses: (businesses) => set({ businesses }),
      setCurrentStaff: (staff) => set({ currentStaff: staff }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      resetStore: () =>
        set({
          selectedBusinessId: null,
          businesses: [],
          currentStaff: null,
        }),
    }),
    {
      name: "leka-hotel-storage",
      partialize: (state) => ({
        selectedBusinessId: state.selectedBusinessId,
        currentStaff: state.currentStaff,
        theme: state.theme,
      }),
    }
  )
);
