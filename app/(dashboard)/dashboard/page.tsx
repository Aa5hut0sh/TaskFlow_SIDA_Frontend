"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/services/analytics.service";
import { taskService } from "@/services/task.service";
import { DashboardMetrics, Task } from "@/types";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase, CheckCircle2, Clock, Target, Plus, ArrowRight,
  TrendingUp, LayoutGrid, Calendar, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const promises: [Promise<DashboardMetrics>, Promise<any>?] = [
          analyticsService.getMetrics(),
        ];
        // Non-admins also fetch their own tasks for the personal panel
        if (!isAdmin) {
          const tasksPromise = taskService.getTasks({ limit: 5, status: "" });
          const [metricsData, tasksData] = await Promise.all([
            analyticsService.getMetrics(),
            tasksPromise,
          ]);
          setMetrics(metricsData);
          setMyTasks(tasksData.data);
        } else {
          const metricsData = await analyticsService.getMetrics();
          setMetrics(metricsData);
        }
      } catch (error) {
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  if (isLoading || !metrics) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return isAdmin
    ? <AdminDashboard user={user} metrics={metrics} />
    : <UserDashboard user={user} metrics={metrics} tasks={myTasks} />;
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
// Unchanged from your original — it already looks good

function AdminDashboard({ user, metrics }: { user: any; metrics: DashboardMetrics }) {
  const hasData = metrics.totalTasks > 0;
  const inProgressTasks = metrics.totalTasks - metrics.completedTasks - metrics.pendingTasks;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Global overview of your company's projects and tasks.
          </p>
        </div>
        <Link href="/tasks">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      {/* 4-col metric grid — all four slots filled for admin */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Projects"
          value={metrics.totalProjects}
          sub="Active workspaces"
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Total Tasks"
          value={metrics.totalTasks}
          sub="Across all projects"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Completed"
          value={metrics.completedTasks}
          sub={hasData ? `${metrics.completionRate}% completion rate` : "No data yet"}
          subColor="text-emerald-500"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          label="Pending"
          value={metrics.pendingTasks}
          sub="Awaiting action"
          subColor="text-amber-500"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VelocityCard metrics={metrics} hasData={hasData} />
        <BreakdownCard metrics={metrics} hasData={hasData} inProgressTasks={inProgressTasks} />
        <Card className="border-border shadow-md bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate your workspace</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/tasks" className="w-full">
              <Button variant="secondary" className="w-full justify-between h-12">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />View All Tasks</div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects" className="w-full">
              <Button variant="secondary" className="w-full justify-between h-12">
                <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Manage Projects</div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/team" className="w-full">
              <Button variant="secondary" className="w-full justify-between h-12">
                <div className="flex items-center gap-2"><Target className="h-4 w-4" />Team Directory</div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/tasks" className="w-full">
              <Button className="w-full justify-between h-12">
                <div className="flex items-center gap-2"><Plus className="h-4 w-4" />Create New Task</div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── User Dashboard ────────────────────────────────────────────────────────────
// Redesigned — personal focus, no empty spaces

function UserDashboard({
  user, metrics, tasks,
}: {
  user: any;
  metrics: DashboardMetrics;
  tasks: Task[];
}) {
  const hasData = metrics.totalTasks > 0;
  const inProgressTasks = metrics.totalTasks - metrics.completedTasks - metrics.pendingTasks;

  // Classify tasks for the personal panel
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "COMPLETED"
  );
  const dueTodayTasks = tasks.filter(
    (t) => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "COMPLETED"
  );
  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div className="space-y-8">

      {/* Header — personal, no admin button */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's the current status of your assigned workspace.
        </p>
      </div>

      {/* 3-col metric grid — fits perfectly without the Projects card */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="My Tasks"
          value={metrics.totalTasks}
          sub="Total assigned to you"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="Completed"
          value={metrics.completedTasks}
          sub={hasData ? `${metrics.completionRate}% done` : "None yet"}
          subColor="text-emerald-500"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <MetricCard
          label="Pending"
          value={metrics.pendingTasks}
          sub="Awaiting your action"
          subColor="text-amber-500"
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Middle row: progress + personal task list */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Left col: Velocity + Breakdown stacked — takes 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <VelocityCard metrics={metrics} hasData={hasData} />
          <BreakdownCard metrics={metrics} hasData={hasData} inProgressTasks={inProgressTasks} />
        </div>

        {/* Right col: My Tasks panel — takes 3/5 */}
        <Card className="lg:col-span-3 border-border shadow-md bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle>My Tasks</CardTitle>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <CardDescription>Your active and upcoming work.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 border-2 border-dashed border-border rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="font-medium text-gray-700">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-0.5">No active tasks right now.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Overdue banner */}
                {overdueTasks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {overdueTasks.length} task{overdueTasks.length > 1 ? "s are" : " is"} overdue
                  </div>
                )}
                {/* Due today banner */}
                {dueTodayTasks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {dueTodayTasks.length} task{dueTodayTasks.length > 1 ? "s" : ""} due today
                  </div>
                )}

                {activeTasks.map((task) => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate));
                  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Status dot */}
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-amber-400"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          {task.project?.title && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.project.title}</p>
                          )}
                        </div>
                      </div>
                      {/* Due date */}
                      {task.dueDate && (
                        <span className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? "text-rose-700 bg-rose-50 border border-rose-100"
                            : isDueToday
                            ? "text-amber-700 bg-amber-50 border border-amber-100"
                            : "text-gray-500 bg-gray-100"
                        }`}>
                          {isDueToday ? "Today" : isOverdue ? "Overdue" : format(new Date(task.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>
                  );
                })}

                <Link href="/tasks" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl border-gray-200 text-xs h-9">
                    Open full task list <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Shared subcomponents ──────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, subColor = "text-muted-foreground", icon,
}: {
  label: string;
  value: number;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
      </CardContent>
    </Card>
  );
}

function VelocityCard({ metrics, hasData }: { metrics: DashboardMetrics; hasData: boolean }) {
  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle>Workspace Velocity</CardTitle>
        </div>
        <CardDescription>Completion rate based on assigned tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Task Completion</span>
              <span className="text-sm font-bold">{metrics.completionRate}%</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.completionRate === 100
                ? "Incredible — your board is completely clear."
                : metrics.completionRate > 50
                ? "More than halfway there. Keep the momentum!"
                : "Plenty of work ahead. Let's start knocking these out."}
            </p>
          </div>
        ) : (
          <EmptyState icon={<Target className="h-8 w-8 text-muted-foreground" />} message="No tasks yet" />
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  metrics, hasData, inProgressTasks,
}: {
  metrics: DashboardMetrics;
  hasData: boolean;
  inProgressTasks: number;
}) {
  return (
    <Card className="border-border shadow-md bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <CardTitle>Task Breakdown</CardTitle>
        </div>
        <CardDescription>Distribution by current status.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            <BreakdownRow label="Completed" count={metrics.completedTasks} total={metrics.totalTasks} color="bg-emerald-500" dotColor="bg-emerald-500" />
            <BreakdownRow label="Pending" count={metrics.pendingTasks} total={metrics.totalTasks} color="bg-amber-500" dotColor="bg-amber-500" />
            {inProgressTasks > 0 && (
              <BreakdownRow label="In Progress" count={inProgressTasks} total={metrics.totalTasks} color="bg-blue-500" dotColor="bg-blue-500" />
            )}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {metrics.totalTasks} total tasks across your workspace
            </p>
          </div>
        ) : (
          <EmptyState icon={<LayoutGrid className="h-8 w-8 text-muted-foreground" />} message="No breakdown available yet." />
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  label, count, total, color, dotColor,
}: {
  label: string; count: number; total: number; color: string; dotColor: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
        </div>
        <span className="font-semibold w-6 text-right">{count}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 border-2 border-dashed border-border rounded-xl">
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}