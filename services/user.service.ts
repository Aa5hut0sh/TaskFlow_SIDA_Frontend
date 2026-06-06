import api from "../lib/api";
import { User, Task, ApiResponse } from "../types";

export const userService = {
  getUsers: async (department?: string): Promise<User[]> => {
    const params = department ? { department } : {};
    const res = await api.get<ApiResponse<User[]>>("/users", { params });
    return res.data.data;
  },

  getMyTasks: async (): Promise<Task[]> => {
    const res = await api.get<ApiResponse<Task[]>>("/users/me/tasks");
    return res.data.data;
  },
};