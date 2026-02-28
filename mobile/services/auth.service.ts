import api from "./api";
import type { AuthResponse, RegisterInput } from "../types/api";

export const authService = {
  /** Admin + Security login */
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    return data;
  },

  /** Employee login */
  async signin(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/signin", {
      email,
      password,
    });
    return data;
  },

  /** Employee registration */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/register", input);
    return data;
  },

  async forgotPassword(
    email: string
  ): Promise<{ message: string; resetToken?: string }> {
    const { data } = await api.post("/api/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const { data } = await api.post("/api/auth/reset-password", {
      token,
      newPassword,
    });
    return data;
  },
};
