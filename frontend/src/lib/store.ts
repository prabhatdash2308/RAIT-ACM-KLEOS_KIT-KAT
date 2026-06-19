import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  type: 'citizen' | 'merchant' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'digirakshak-auth' }
  )
);

interface ScanState {
  scanResult: unknown | null;
  setScanResult: (result: unknown) => void;
  clearScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scanResult: null,
  setScanResult: (result) => set({ scanResult: result }),
  clearScan: () => set({ scanResult: null }),
}));
