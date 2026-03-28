import { create } from 'zustand';
import type { User } from '@lovable-clone/shared';
import * as authApi from '../api/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,

  login: async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('token', token);
    set({ token, user });
  },

  signup: async (email, password, name) => {
    const { token, user } = await authApi.signup(email, password, name);
    localStorage.setItem('token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  loadUser: async () => {
    try {
      set({ loading: true });
      const user = await authApi.getMe();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, loading: false });
    }
  },
}));
