import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ClipboardCheck,
  UserPlus,
  UserCheck,
  Search,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  FolderOpen,
  Users,
  CalendarDays,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

type Role = 'staff' | 'manager' | 'admin';
type AccessTag = 'STAFF' | 'MANAGER' | 'ADMIN';

interface QuickAction {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: { bg: string; ring: string; icon: string };
  path: string;
  access: AccessTag;
}

interface SessionItem {
  id: string;
  name: string;
  time: string;
  enrolled: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  tone: 'join' | 'check' | 'approve' | 'register';
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const quickActions: QuickAction[] = [
  {
    key: 'attendance',
    label: 'Mark Attendance',
    description: "Record who showed up to today's sessions",
    icon: ClipboardCheck,
    tone: { bg: 'bg-blue-500/15', ring: 'ring-blue-500/20', icon: 'text-blue-400' },
    path: '/attendance',
    access: 'STAFF',
  },
  {
    key: 'add-participant',
    label: 'Add Participant',
    description: 'Register someone new to the centre',
    icon: UserPlus,
    tone: { bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/20', icon: 'text-emerald-400' },
    path: '/add-participant-multistep',
    access: 'MANAGER',
  },
  {
    key: 'add-to-program',
    label: 'Add to Program',
    description: 'Enroll a participant in a program',
    icon: UserCheck,
    tone: { bg: 'bg-purple-500/15', ring: 'ring-purple-500/20', icon: 'text-purple-400' },
    path: '/add-to-program',
    access: 'MANAGER',
  },
  {
    key: 'search',
    label: 'Find Participant',
    description: 'Search by name, email or phone',
    icon: Search,
    tone: { bg: 'bg-orange-500/15', ring: 'ring-orange-500/20', icon: 'text-orange-400' },
    path: '/search',
    access: 'ADMIN',
  },
  {
    key: 'reports',
    label: 'View Reports',
    description: 'Attendance, programs, demographics',
    icon: BarChart3,
    tone: { bg: 'bg-cyan-500/15', ring: 'ring-cyan-500/20', icon: 'text-cyan-300' },
    path: '/reports',
    access: 'ADMIN',
  },
  {
    key: 'programs',
    label: 'Manage Programs',
    description: 'Create and edit programs & schedules',
    icon: FolderOpen,
    tone: { bg: 'bg-pink-500/15', ring: 'ring-pink-500/20', icon: 'text-pink-400' },
    path: '/programs',
    access: 'ADMIN',
  },
  {
    key: 'training',
    label: 'Staff Training',
    description: 'Tutorials and best practices',
    icon: GraduationCap,
    tone: { bg: 'bg-indigo-500/15', ring: 'ring-indigo-500/20', icon: 'text-indigo-400' },
    path: '/training',
    access: 'STAFF',
  },
  {
    key: 'approvals',
    label: 'User Approvals',
    description: 'Review pending staff registrations',
    icon: CheckCircle2,
    tone: { bg: 'bg-rose-500/15', ring: 'ring-rose-500/20', icon: 'text-rose-400' },
    path: '/approvals',
    access: 'ADMIN',
  },
];

function canAccess(role: Role | undefined, access: AccessTag): boolean {
  if (!role) return false;
  if (access === 'STAFF') return true;
  if (access === 'MANAGER') return role === 'manager' || role === 'admin';
  return role === 'admin';
}

const accessTone: Record<AccessTag, string> = {
  STAFF: 'bg-zinc-800/80 text-zinc-400',
  MANAGER: 'bg-blue-500/10 text-blue-300',
  ADMIN: 'bg-amber-500/10 text-amber-300',
};

interface Stat {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  accent: string;
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeParticipants: 0,
    activePrograms: 0,
    programsToday: 0,
    sessionsRunningNow: 0,
    pendingApprovals: 0,
  });
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => daysOfWeek[new Date().getDay()], []);

  useEffect(() => {
    (async () => {
      try {
        const [{ count: totalParticipants }, { data: programs }, { count: pendingApprovals }] = await Promise.all([
          supabase.from('participants').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approved', false),
        ]);

        const programsToday = (programs || []).filter((p: any) => p.days?.includes(today));
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        const sessionsRunningNow = programsToday.filter((p: any) => {
          if (!p.start_time || !p.end_time) return false;
          const [sh, sm] = p.start_time.split(':').map(Number);
          const [eh, em] = p.end_time.split(':').map(Number);
          const start = sh * 60 + sm;
          const end = eh * 60 + em;
          return nowMins >= start && nowMins <= end;
        }).length;

        const enrollmentsByProgram: Record<string, number> = {};
        if (programsToday.length) {
          const ids = programsToday.map((p: any) => p.id);
          const { data: enrollments } = await supabase
            .from('program_enrollments')
            .select('program_id')
            .in('program_id', ids);
          (enrollments || []).forEach((row: any) => {
            enrollmentsByProgram[row.program_id] = (enrollmentsByProgram[row.program_id] || 0) + 1;
          });
        }

        const sessionList: SessionItem[] = programsToday
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            time: `${p.start_time?.slice(0, 5) || ''}–${p.end_time?.slice(0, 5) || ''}`,
            enrolled: enrollmentsByProgram[p.id] || 0,
          }));

        const [{ data: recentProfiles }, { data: recentParticipants }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, role, approved, created_at')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('participants')
            .select('id, first_name, last_name, created_at')
            .order('created_at', { ascending: false })
            .limit(4),
        ]);

        const recentActivity: ActivityItem[] = [];
        (recentProfiles || []).forEach((p: any) => {
          recentActivity.push({
            id: `profile-${p.id}`,
            title: p.full_name || p.email,
            subtitle: p.approved ? `Approved as ${p.role}` : 'Awaiting approval',
            when: timeAgo(p.created_at),
            tone: p.approved ? 'approve' : 'join',
          });
        });
        (recentParticipants || []).forEach((p: any) => {
          recentActivity.push({
            id: `participant-${p.id}`,
            title: `${p.first_name} ${p.last_name}`,
            subtitle: 'Registered as a participant',
            when: timeAgo(p.created_at),
            tone: 'register',
          });
        });

        setStats({
          totalParticipants: totalParticipants || 0,
          activeParticipants: totalParticipants || 0,
          activePrograms: (programs || []).length,
          programsToday: programsToday.length,
          sessionsRunningNow,
          pendingApprovals: pendingApprovals || 0,
        });
        setSessions(sessionList);
        setActivity(recentActivity.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  const statCards: Stat[] = [
    {
      label: 'Total Participants',
      value: stats.totalParticipants,
      hint: `${stats.activeParticipants} active`,
      icon: Users,
      accent: 'text-blue-400',
    },
    {
      label: 'Active Programs',
      value: stats.activePrograms,
      hint: `${stats.programsToday} running today`,
      icon: FolderOpen,
      accent: 'text-emerald-400',
    },
    {
      label: "Today's Sessions",
      value: stats.programsToday,
      hint: `${stats.sessionsRunningNow} running now`,
      icon: Clock,
      accent: 'text-amber-400',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      hint: stats.pendingApprovals ? 'awaiting review' : 'all caught up',
      icon: ShieldCheck,
      accent: 'text-rose-400',
    },
  ];

  const visibleActions = quickActions.filter((a) => canAccess(user?.role as Role, a.access));

  const activityIcon = (tone: ActivityItem['tone']) => {
    switch (tone) {
      case 'approve':
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'join':
        return <UserPlus size={14} className="text-blue-400" />;
      case 'register':
        return <UserCheck size={14} className="text-purple-400" />;
      default:
        return <TrendingUp size={14} className="text-zinc-400" />;
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, <span className="text-zinc-300">{user?.name || 'friend'}</span>
          {user?.email && <span className="text-zinc-600"> · {user.email}</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</span>
                <Icon size={15} className={s.accent} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-zinc-50">{loading ? '—' : s.value}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">{s.hint}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-zinc-100">Quick actions</h2>
          <p className="text-xs text-zinc-500">Jump straight into common tasks</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => navigate(a.path)}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-[#111113] p-4 text-left transition-all hover:border-zinc-700 hover:bg-[#141416]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${a.tone.bg} ${a.tone.ring}`}
                  >
                    <Icon size={17} className={a.tone.icon} />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${accessTone[a.access]}`}
                  >
                    {a.access}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{a.label}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{a.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's sessions + Recent activity */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] lg:col-span-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-100">Today's sessions</h3>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-blue-400 transition-colors hover:text-blue-300"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No sessions scheduled for {today}.
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">{s.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {s.time} · {s.enrolled} enrolled
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/attendance')}
                    className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    Start <ArrowRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
            <TrendingUp size={15} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Recent activity</h3>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">Loading…</div>
            ) : activity.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">No recent activity.</div>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900">
                    {activityIcon(a.tone)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-100">{a.title}</div>
                    <div className="truncate text-xs text-zinc-500">{a.subtitle}</div>
                  </div>
                  <div className="whitespace-nowrap text-[11px] text-zinc-600">{a.when}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
