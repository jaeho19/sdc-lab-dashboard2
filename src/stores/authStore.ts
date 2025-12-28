import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Database } from "@/types/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

interface AuthState {
  member: Member | null;
  isAdmin: boolean;
  setMember: (member: Member | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      isAdmin: false,
      setMember: (member) =>
        set({
          member,
          isAdmin: member?.position === "professor",
        }),
      clearAuth: () =>
        set({
          member: null,
          isAdmin: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
