"use client";

import { useState, useEffect } from "react";
import { Project, Commit } from "@/types";
import { projectService } from "@/services/project.service";
import { format } from "date-fns";
import { X, GitCommit, ExternalLink, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

interface ProjectDetailsSheetProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDetailsSheet({ project, isOpen, onClose }: ProjectDetailsSheetProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCommits = async () => {
      if (!project || !project.githubRepoUrl) {
        setCommits([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await projectService.getProjectCommits(project.id);
        setCommits(data);
      } catch (error) {
        toast.error("Failed to sync with GitHub");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) fetchCommits();
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Project Workspace</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{project.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {project.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">GitHub Activity Stream</p>
              {project.githubRepoUrl && (
                <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  View Repository <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {!project.githubRepoUrl ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <GithubIcon className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-700">No Repository Linked</p>
                <p className="text-xs text-gray-400 mt-1">Add a GitHub URL to this project to view live commits.</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : commits.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
                No recent commits found on the main branch.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {commits.slice(0, 10).map((commit, i) => (
                  <div key={commit.sha} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-100 text-gray-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <GitCommit className="w-4 h-4" />
                    </div>
                    
                    {/* Commit Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{commit.author}</span>
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                          {format(new Date(commit.date), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{commit.message}</p>
                      <a href={commit.url} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-gray-400 hover:text-blue-600 mt-2 block">
                        {commit.sha.substring(0, 7)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}