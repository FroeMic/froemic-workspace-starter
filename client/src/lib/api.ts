import { z } from 'zod';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  sessionId: string;
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterData = z.infer<typeof RegisterSchema>;
export type LoginData = z.infer<typeof LoginSchema>;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for httpOnly cookies
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    RegisterSchema.parse(data);
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    LoginSchema.parse(data);
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  }

  async me(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async generateJoke(): Promise<{ success: boolean; joke: any }> {
    return this.request<{ success: boolean; joke: any }>('/jokes/generate', {
      method: 'POST',
    });
  }

  async getJokes(): Promise<{ jokes: any[] }> {
    return this.request<{ jokes: any[] }>('/jokes');
  }
}

export const apiClient = new ApiClient(API_BASE);