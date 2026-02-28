import api from "./api";
import type { Flag } from "../types/api";

export const flagsService = {
  async createFlag(slotId: string, vehicleId: string): Promise<Flag> {
    const { data } = await api.post<Flag>("/api/flags", { slotId, vehicleId });
    return data;
  },

  async listFlags(resolved?: boolean): Promise<Flag[]> {
    const params =
      resolved !== undefined ? { resolved: resolved.toString() } : {};
    const { data } = await api.get<{ flags: Flag[] }>("/api/flags", {
      params,
    });
    return data.flags;
  },

  async resolveFlag(flagId: string): Promise<Flag> {
    const { data } = await api.patch<Flag>(`/api/flags/${flagId}/resolve`);
    return data;
  },
};
