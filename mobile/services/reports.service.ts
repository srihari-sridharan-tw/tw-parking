import api from "./api";
import type { DailyReport } from "../types/api";

export const reportsService = {
  async getDailyReport(): Promise<DailyReport> {
    const { data } = await api.get<DailyReport>("/api/reports/daily");
    return data;
  },
};
