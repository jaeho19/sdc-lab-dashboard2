import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Member } from "@/types/database";

interface AuthState {
  user: User | null;
  member: Member | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setMember: (member: Member | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  isAdmin: () => boolean;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  member: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setMember: (member) => set({ member }),
  setIsLoading: (isLoading) => set({ isLoading }),
  isAdmin: () => get().member?.position === "professor",
  reset: () => set({ user: null, member: null, isLoading: false }),
}));
