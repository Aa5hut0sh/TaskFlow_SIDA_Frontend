"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2, Paperclip, UploadCloud, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { taskService } from "@/services/task.service";
import { userService } from "@/services/user.service";
import { projectService } from "@/services/project.service";
import { User, Project } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // ← new
  const fileInputRef = useRef<HTMLInputElement>(null);           // ← new

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", projectId: "", assigneeId: "", dueDate: "" },
  });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingData(true);
      const fetchData = async () => {
        try {
          const [fetchedUsers, fetchedProjects] = await Promise.all([
            userService.getUsers(),
            projectService.getProjects(),
          ]);
          setUsers(fetchedUsers.filter((u) => u.role === "USER"));
          setProjects(fetchedProjects);
        } catch {
          toast.error("Failed to load users and projects");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else {
      // Reset files when modal closes
      setPendingFiles([]);
    }
  }, [isOpen]);

  // ← Add / remove staged files
  const handleFileStage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...files.filter((f) => !existingNames.has(f.name))];
    });
    e.target.value = ""; // allow re-selecting same file
  };

  const removeFile = (name: string) =>
    setPendingFiles((prev) => prev.filter((f) => f.name !== name));

  const onSubmit = async (data: TaskFormValues) => {
    const loadingId = toast.loading("Creating task...");
    try {
      // Step 1: create task
      const newTask = await taskService.createTask({
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });

      // Step 2: upload attachments sequentially (keeps S3 keys predictable)
      if (pendingFiles.length > 0) {
        toast.dismiss(loadingId);
        const uploadId = toast.loading(`Uploading ${pendingFiles.length} file(s)...`);
        try {
          for (const file of pendingFiles) {
            await taskService.uploadAttachment(newTask.id, file);
          }
          toast.dismiss(uploadId);
          toast.success("Task created with attachments!");
        } catch {
          toast.dismiss(uploadId);
          toast.warning("Task created, but some uploads failed.");
        }
      } else {
        toast.dismiss(loadingId);
        toast.success("Task assigned successfully!");
      }

      form.reset();
      setPendingFiles([]);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error("Failed to create task", {
        description: error.response?.data?.message || "Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="pr-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Task</h2>
            <p className="text-sm text-gray-500 mt-1">Assign a deliverable to a team member.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {isLoadingData ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Update landing page copy" className="h-11 rounded-xl bg-gray-50 border-gray-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Provide details about what needs to be done..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="projectId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Project</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select project...</option>
                          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="assigneeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Assign To</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select team member...</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 rounded-xl bg-gray-50 border-gray-200 block" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ← File staging area */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Attachments (Optional)</p>

                  {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                      {pendingFiles.map((file) => (
                        <div key={file.name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm group">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium overflow-hidden">
                            <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
                            <span className="truncate max-w-[300px]">{file.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileStage} />
                    <UploadCloud className="w-7 h-7 text-gray-400 mb-1.5" />
                    <p className="text-sm font-semibold text-gray-700">Add files</p>
                    <p className="text-xs text-gray-400 mt-0.5">They'll upload after the task is created</p>
                  </label>
                </div>

                <div className="pt-4 flex justify-center gap-4 w-full">
                  <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 font-semibold" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold shadow-sm"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? (pendingFiles.length > 0 ? "Creating & uploading..." : "Creating...")
                      : `Create Task${pendingFiles.length > 0 ? ` + ${pendingFiles.length} file(s)` : ""}`
                    }
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}