import api from "../lib/api";
import { User, ApiResponse, Department } from "../types";

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  department: Department;
}

export interface AdminRegisterDTO extends RegisterDTO {
  adminSecret: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export const authService = {
  login: async (data: LoginDTO): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterDTO): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    return res.data;
  },

  registerAdmin: async (data: AdminRegisterDTO): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register/admin", data);
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; user: User }>("/auth/profile");
    return res.data.user; 
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};