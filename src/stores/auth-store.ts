import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role } from "@/generated/prisma";

interface AuthState {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: Role | null;
  clientId: string | null;
  clientName: string | null;
  isLoggedIn: boolean;
  _hasHydrated: boolean;
  _authChecked: boolean;

  setUser: (user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    clientId: string | null;
    clientName: string | null;
  }) => void;
  clearUser: () => void;
  setHydrated: (hydrated: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      name: null,
      email: null,
      role: null,
      clientId: null,
      clientName: null,
      isLoggedIn: false,
      _hasHydrated: false,
      _authChecked: false,

      setUser: (user) =>
        set({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
          clientName: user.clientName,
          isLoggedIn: true,
        }),

      clearUser: () =>
        set({
          userId: null,
          name: null,
          email: null,
          role: null,
          clientId: null,
          clientName: null,
          isLoggedIn: false,
        }),

      setHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setAuthChecked: (checked) => set({ _authChecked: checked }),
    }),
    {
      name: "tigon-portal-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        name: state.name,
        email: state.email,
        role: state.role,
        clientId: state.clientId,
        clientName: state.clientName,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
