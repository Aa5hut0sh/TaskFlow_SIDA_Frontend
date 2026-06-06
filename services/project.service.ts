import api from "../lib/api";
import { Project, Commit, ApiResponse } from "../types";

interface CreateProjectDTO {
  title: string;
  description: string;
  githubRepoUrl?: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const res = await api.get<ApiResponse<Project[]>>("/projects");
    return res.data.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  createProject: async (data: CreateProjectDTO): Promise<Project> => {
    const res = await api.post<ApiResponse<Project>>("/projects", data);
    return res.data.data;
  },

  updateProject: async (id: string, data: Partial<CreateProjectDTO>): Promise<Project> => {
    const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getProjectCommits: async (id: string): Promise<Commit[]> => {
    const res = await api.get<ApiResponse<Commit[]>>(`/projects/${id}/commits`);
    return res.data.data;
  },
};