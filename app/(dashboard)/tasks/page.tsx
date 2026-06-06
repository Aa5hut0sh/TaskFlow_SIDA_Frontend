"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/task.service";
import { Task, TaskStatus } from "@/types";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Search,
  Plus,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import TaskDetailsSheet from "@/components/tasks/TaskDetailsSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
  const { isAdmin } = useAuth();

  // State for data
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // State for server-side queries
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [refreshTick, setRefreshTick] = useState(0);

  // Fetch data whenever page, search, or filters change
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Debounce logic could go here for the search, but we will keep it simple
        const response = await taskService.getTasks({
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });

        setTasks(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent spamming the API while typing
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search, statusFilter, refreshTick]);

  // Helper for status badges
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Tasks
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track your deliverables.
          </p>
        </div>

        {/* Only Admins can create new tasks */}
        {isAdmin && (
          <Button
            className="bg-black text-white hover:bg-gray-800 rounded-xl shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* 2. Filters & Search Bar */}
      <Card className="p-4 rounded-2xl shadow-sm border-gray-100 bg-white flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks by title..."
            className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-gray-200"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val as TaskStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[140px] rounded-xl border-gray-200 bg-gray-50 text-sm font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-lg">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 3. The Data Table */}
      <Card className="rounded-2xl shadow-sm border-gray-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="font-semibold text-gray-600">
                  Task Name
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Project
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Assignee
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Due Date
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-gray-500"
                  >
                    No tasks found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {task.project?.title || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">
                          {task.assignee?.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {task.assignee?.department}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {task.dueDate
                        ? format(new Date(task.dueDate), "MMM dd, yyyy")
                        : "No date"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 rounded-lg"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 4. Pagination Controls */}
        {!isLoading && tasks.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/30">
            <p className="text-sm text-gray-500 font-medium">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          if (page === 1) {
            window.location.reload();
          } else {
            setPage(1);
          }
        }}
      />

      <TaskDetailsSheet
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={() => setRefreshTick((t) => t + 1)}
      />
    </div>
  );
}
