import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoggedIn: boolean;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  login: (user: { name: string; email: string; avatarUrl?: string }) => void;
  logout: () => void;
  updateAvatarUrl: (url: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (user) => set({ isLoggedIn: true, user }),
      logout: () => set({ isLoggedIn: false, user: null }),
      updateAvatarUrl: (url) => set((state) => ({ 
        user: state.user ? { ...state.user, avatarUrl: url } : null 
      })),
    }),
    {
      name: "legacy-xi-auth",
    }
  )
);
