export type Role = "ADMIN" | "USER";

export type Department = "FRONTEND" | "BACKEND" | "FULLSTACK" | "DEVOPS" | "QA" | "UI_UX";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  githubRepoUrl?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  attachments: string[];
  dueDate: string | null;
  projectId: string;
  assigneeId: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, "name" | "department">; // Joined data
  project?: Pick<Project, "title">; // Joined data
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}