"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { User } from "@/types";
import { Loader2, Mail, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function TeamPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await userService.getUsers();
        setTeam(data);
      } catch (error) {
        toast.error("Failed to load team directory");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const visibleTeam = isAdmin
    ? team
    : team.filter(
        (m) => m.role === "USER" && m.department === currentUser?.department,
      );

  const departmentLabel = currentUser?.department?.replace("_", "/");

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Team Directory
        </h1>
        <p className="text-gray-500 mt-1">
          {isAdmin
            ? "All members across every department."
            : `Your colleagues in ${departmentLabel}.`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : visibleTeam.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
          No team members found.
        </div>
      ) : isAdmin ? (
        <AdminView team={team} currentUserId={currentUser?.id} />
      ) : (
        <MemberGrid members={visibleTeam} currentUserId={currentUser?.id} />
      )}
    </div>
  );
}

function AdminView({
  team,
  currentUserId,
}: {
  team: User[];
  currentUserId?: string;
}) {
  const grouped = team.reduce<Record<string, User[]>>((acc, member) => {
    const key = member.department ?? "Unknown";
    (acc[key] ??= []).push(member);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([dept, members]) => (
        <section key={dept}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold text-gray-500 tracking-wider uppercase">
              {dept.replace("_", "/")}
            </h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {members.length}
            </span>
          </div>
          <MemberGrid members={members} currentUserId={currentUserId} />
        </section>
      ))}
    </div>
  );
}

function MemberGrid({
  members,
  currentUserId,
}: {
  members: User[];
  currentUserId?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isCurrentUser={member.id === currentUserId}
        />
      ))}
    </div>
  );
}

function MemberCard({
  member,
  isCurrentUser,
}: {
  member: User;
  isCurrentUser?: boolean;
}) {
  const avatarColors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
    "bg-cyan-100 text-cyan-600",
  ];
  const colorClass =
    avatarColors[member.name.charCodeAt(0) % avatarColors.length];

  return (
    <Card className="p-6 rounded-2xl shadow-sm border-gray-100 bg-white hover:shadow-md transition-all relative">
      {isCurrentUser && (
        <span className="absolute top-4 right-4 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
          You
        </span>
      )}

      <div className="flex items-center gap-4 mb-5">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border border-white ring-2 ring-gray-100 ${colorClass}`}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{member.name}</h3>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
              member.role === "ADMIN"
                ? "text-purple-700 bg-purple-50"
                : "text-blue-600 bg-blue-50"
            }`}
          >
            {member.role}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-gray-50 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
          {member.department.replace("_", "/")}
        </div>
      </div>
    </Card>
  );
}
