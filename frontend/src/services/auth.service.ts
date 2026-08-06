const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? 'Falha ao autenticar');
  }

  return response.json();
}

export function saveAuth(data: AuthResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sportdelivery_token', data.accessToken);
  localStorage.setItem('sportdelivery_user', JSON.stringify(data.user));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sportdelivery_token');
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('sportdelivery_user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sportdelivery_token');
  localStorage.removeItem('sportdelivery_user');
}
