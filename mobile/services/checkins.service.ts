import api from "./api";
import type { CheckIn } from "../types/api";

export const checkinsService = {
  async checkIn(slotId: string): Promise<CheckIn> {
    const { data } = await api.post<CheckIn>("/api/checkins", { slotId });
    return data;
  },

  async checkOut(checkInId: string): Promise<CheckIn> {
    const { data } = await api.patch<CheckIn>(
      `/api/checkins/${checkInId}/checkout`
    );
    return data;
  },

  async myCheckIns(): Promise<CheckIn[]> {
    const { data } = await api.get<{ checkIns: CheckIn[] }>(
      "/api/checkins/mine"
    );
    return data.checkIns;
  },

  async forceCheckoutAll(password: string): Promise<{ count: number }> {
    const { data } = await api.post<{ count: number }>(
      "/api/checkins/force-checkout",
      { password }
    );
    return data;
  },
};
