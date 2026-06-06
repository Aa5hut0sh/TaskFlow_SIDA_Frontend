"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@/types";
import { taskService } from "@/services/task.service";
import { format } from "date-fns";
import {
  X,
  Calendar,
  Folder,
  User,
  Paperclip,
  UploadCloud,
  Trash2,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TaskDetailsSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function TaskDetailsSheet({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailsSheetProps) {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setAttachments(task.attachments || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isCreatorAdmin = isAdmin && user?.id === task.creatorId;
  const isAssignee = !isAdmin && user?.id === task.assigneeId;
  const canModify = isCreatorAdmin || isAssignee; // only these two can change anything

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === status || !canModify) return;
    setIsUpdatingStatus(true);
    try {
      await taskService.updateStatus(task.id, newStatus);
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      onTaskUpdated();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteTask = () => {
  if (!isCreatorAdmin) return;
  setIsConfirmOpen(true);
};

const handleDeleteConfirm = async () => {
  setIsDeletingTask(true);
  try {
    await taskService.deleteTask(task.id);
    toast.success("Task deleted");
    onTaskUpdated();
    onClose();
  } catch (error) {
    toast.error("Failed to delete task");
  } finally {
    setIsDeletingTask(false);
    setIsConfirmOpen(false);
  }
};

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModify) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const loadingId = toast.loading("Uploading file...");
    try {
      const updatedTask = await taskService.uploadAttachment(task.id, file);
      setAttachments(updatedTask.attachments);
      toast.dismiss(loadingId);
      toast.success("File uploaded successfully");
      onTaskUpdated();
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error("Upload failed. Check file constraints.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = async (fileUrl: string) => {
    if (!canModify) return;
    const loadingId = toast.loading("Removing asset...");
    try {
      const updatedTask = await taskService.removeAttachment(task.id, fileUrl);
      setAttachments(updatedTask.attachments);
      toast.dismiss(loadingId);
      toast.success("Asset deleted securely");
      onTaskUpdated();
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error("Failed to delete asset");
    }
  };

  const getCleanFileName = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      return decoded.substring(decoded.lastIndexOf("/") + 1);
    } catch {
      return "Download Attachment";
    }
  };

  const isCompleted = status === "COMPLETED";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Task Workspace
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCreatorAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg gap-1.5"
                onClick={handleDeleteTask}
                disabled={isDeletingTask}
              >
                {isDeletingTask ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold">Delete</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug">
              {task.title}
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-500 rounded-xl">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Project
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {task.project?.title || "Standalone"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-500 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Assignee
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {task.assignee?.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {task.assignee?.department.replace("_", "/")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 col-span-2 mt-2">
              <div className="p-2 bg-gray-100 text-gray-500 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Due Date
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "MMMM dd, yyyy")
                    : "No fixed timeline"}
                </p>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Operational Status
            </p>
            <div className="relative">
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                {(["PENDING", "IN_PROGRESS", "COMPLETED"] as TaskStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={isUpdatingStatus || !canModify}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                        status === s
                          ? "bg-white text-gray-900 shadow-sm border border-gray-100 scale-[1.02]"
                          : "text-gray-500"
                      } ${
                        !canModify
                          ? "cursor-not-allowed opacity-50"
                          : "hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
              {isUpdatingStatus && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </div>
                </div>
              )}
              {isAdmin && !isCreatorAdmin && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  View only — you didn't create this task.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Project Assets & Attachments
            </p>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm group"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-black font-medium overflow-hidden truncate max-w-[85%]"
                    >
                      <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
                      <span className="truncate">{getCleanFileName(url)}</span>
                    </a>

                    {canModify && (
                      <button
                        onClick={() => handleRemoveAttachment(url)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!canModify ? (
              <div className="flex items-center gap-3 border border-gray-100 bg-gray-50 rounded-2xl p-4">
                <AlertTriangle className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-500 font-medium">
                  You can view attachments but cannot upload or remove files.
                </p>
              </div>
            ) : isCompleted ? (
              <div className="flex items-center gap-3 border border-amber-100 bg-amber-50 rounded-2xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">
                  Task is completed — uploads are disabled.
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors relative">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-gray-400 mb-2 animate-spin" />
                    <p className="text-sm font-semibold text-gray-700">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      Upload workspace document
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Files pipe securely into S3
                    </p>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Task"
        description={`"${task.title}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={isDeletingTask}
      />
    </div>
  );
}
