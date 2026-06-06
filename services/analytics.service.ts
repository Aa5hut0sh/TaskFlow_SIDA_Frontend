import api from "../lib/api";
import { DashboardMetrics, ApiResponse } from "../types";

export const analyticsService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await api.get<ApiResponse<DashboardMetrics>>("/analytics");
    return res.data.data;
  },
};