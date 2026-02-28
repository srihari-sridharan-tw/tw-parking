import api from "./api";
import type { User } from "../types/api";

export const usersService = {
  async listUsers(): Promise<User[]> {
    const { data } = await api.get<{ users: User[] }>("/api/users");
    return data.users;
  },

  async clearEmployees(password: string): Promise<{ count: number }> {
    const { data } = await api.delete<{ count: number }>("/api/users/employees", {
      data: { password },
    });
    return data;
  },
};
