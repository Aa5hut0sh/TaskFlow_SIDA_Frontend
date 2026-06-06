import api from "../lib/api";
import { Task, TaskStatus, PaginatedResponse, ApiResponse } from "../types";

interface CreateTaskDTO {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  dueDate?: string;
}

interface FetchTasksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus | "";
  department?: string;
}

export const taskService = {
  getTasks: async (params: FetchTasksParams): Promise<PaginatedResponse<Task>> => {
    const res = await api.get<PaginatedResponse<Task>>("/tasks", { params });
    return res.data;
  },

  createTask: async (data: CreateTaskDTO): Promise<Task> => {
    const res = await api.post<ApiResponse<Task>>("/tasks", data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  uploadAttachment: async (id: string, file: File): Promise<Task> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  removeAttachment: async (id: string, fileUrl: string): Promise<Task> => {
    const res = await api.delete<ApiResponse<Task>>(`/tasks/${id}/upload`, {
      data: { fileUrl }, // Axios sends body in delete requests via the 'data' config property
    });
    return res.data.data;
  },
};