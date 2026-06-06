"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { projectService } from "@/services/project.service";
import { Project } from "@/types";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Folder,
  ChevronRight,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import ProjectDetailsSheet from "@/components/projects/ProjectDetailsSheet";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth(); // 👈 get user object for id comparison
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(projectToDelete);
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to delete project", {
        description:
          error.response?.data?.message || "You may not have permission.",
      });
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Projects
          </h1>
          <p className="text-gray-500 mt-1">
            Manage active repositories and workspaces.
          </p>
        </div>
        {isAdmin && (
          <Button
            className="bg-black text-white hover:bg-gray-800 rounded-xl shadow-sm"
            onClick={() => {
              setSelectedProject(null);
              setIsCreateModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <Folder className="w-10 h-10 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No projects found</p>
          <p className="text-sm text-gray-500">
            Get started by creating a new workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            // 👇 show actions only if current user is the project creator
            const isOwner = user?.id === project.creatorId;

            return (
              <Card
                key={project.id}
                className="group flex flex-col justify-between p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all border-gray-100 bg-white cursor-pointer"
                onClick={() => {
                  setSelectedProject(project);
                  setIsDetailsOpen(true);
                }}
              >
                {/* Top row */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {project.githubRepoUrl && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                          <GithubIcon className="w-3.5 h-3.5" />
                          Linked
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">
                    Created {format(new Date(project.createdAt), "MMM yyyy")}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isOwner && ( // 👈 only the creator sees edit/delete
                      <>
                        <button
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors hover:cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setIsCreateModalOpen(true);
                          }}
                          title="Edit project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors hover:cursor-pointer"
                          onClick={(e) => handleDeleteClick(e, project.id)}
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={() => {
          fetchProjects();
        }}
        initialData={selectedProject ?? undefined}
      />

      <ProjectDetailsSheet
        project={selectedProject}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProject(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Project"
        description="This action cannot be undone. All tasks under this project will also be affected."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setProjectToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}
