"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, FolderPlus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { projectService } from "@/services/project.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Project = {
  id: string;
  title: string;
  description: string;
  githubRepoUrl?: string | null;
};

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(10, "Please provide a brief description (min 10 chars)"),
  githubRepoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Project;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess, initialData }: CreateProjectModalProps) {
  const isEditMode = !!initialData;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", description: "", githubRepoUrl: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          title: initialData.title,
          description: initialData.description,
          githubRepoUrl: initialData.githubRepoUrl || "",
        });
      } else {
        form.reset({ title: "", description: "", githubRepoUrl: "" });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: ProjectFormValues) => {
    const loadingId = toast.loading(isEditMode ? "Saving changes..." : "Initializing workspace...");
    try {
      if (isEditMode) {
        await projectService.updateProject(initialData.id, data);
        toast.dismiss(loadingId);
        toast.success("Project updated successfully!");
      } else {
        await projectService.createProject({
          ...data,
          githubRepoUrl: data.githubRepoUrl || undefined,
        });
        toast.dismiss(loadingId);
        toast.success("Project created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error(isEditMode ? "Failed to update project" : "Failed to create project", {
        description: error.response?.data?.message || "Please check your network.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 pr-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              {isEditMode ? <Pencil className="w-6 h-6" /> : <FolderPlus className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {isEditMode ? "Edit Project" : "New Workspace"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode
                  ? "Update the details for this project."
                  : "Create a new project container for your team."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold">Project Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Q3 Marketing Site Redesign"
                      className="h-11 rounded-xl bg-gray-50 border-gray-200"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold">Project Description</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="What is the main objective of this workspace?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="githubRepoUrl" render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-end mb-1">
                    <FormLabel className="text-gray-700 font-semibold">GitHub Repository URL</FormLabel>
                    <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Optional</span>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/your-org/your-repo"
                      className="h-11 rounded-xl bg-gray-50 border-gray-200"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Link a public repository to view live commit history directly in the dashboard.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="pt-6 flex justify-center gap-4 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-gray-200 font-semibold"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold shadow-sm"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? (isEditMode ? "Saving..." : "Creating...")
                    : (isEditMode ? "Save Changes" : "Create Project")}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}