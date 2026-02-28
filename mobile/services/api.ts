import axios, { type AxiosError } from "axios";
import { useAuthStore } from "../stores/auth.store";
import type { ApiError } from "../types/api";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, logout and let the root layout redirect to login.
// Exception: password-confirmation endpoints use 401 to signal a wrong
// password, not an expired session — don't log the user out in those cases.
const SKIP_LOGOUT_URLS = ["/api/users/employees", "/api/checkins/force-checkout"];

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const skip = SKIP_LOGOUT_URLS.some((u) => url.includes(u));
      if (!skip) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/** Extract a human-readable message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as ApiError)?.message ??
      error.message ??
      "Something went wrong"
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
