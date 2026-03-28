import api from './client';
import type { AuthResponse } from '@lovable-clone/shared';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
}

export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await api.post('/auth/signup', { email, password, name });
  return res.data.data;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data.data;
}
