import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { User, Calendar, FileText, ArrowRight } from 'lucide-react';

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      key: 'profile',
      label: 'My Profile',
      description: 'View and edit your personal information',
      icon: User,
      tone: { bg: 'bg-blue-500/15', ring: 'ring-blue-500/20', icon: 'text-blue-400' },
      path: '/participant/profile',
    },
    {
      key: 'events',
      label: 'Register for events',
      description: 'Browse and sign up for programs',
      icon: Calendar,
      tone: { bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/20', icon: 'text-emerald-400' },
      path: '/participant/events',
    },
    {
      key: 'records',
      label: 'My records',
      description: 'View your attendance and participation history',
      icon: FileText,
      tone: { bg: 'bg-purple-500/15', ring: 'ring-purple-500/20', icon: 'text-purple-400' },
      path: '/participant/records',
    },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => navigate(a.path)}
              className="group flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-[#111113] p-5 text-left transition-all hover:border-zinc-700 hover:bg-[#141416]"
            >
              <div className="flex flex-1 gap-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${a.tone.bg} ${a.tone.ring}`}>
                  <Icon size={18} className={a.tone.icon} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{a.label}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{a.description}</div>
                </div>
              </div>
              <ArrowRight size={16} className="mt-2 flex-shrink-0 text-zinc-600 group-hover:text-zinc-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Participant ID</div>
          <div className="mt-2 truncate font-mono text-sm text-zinc-200">{user?.id || '—'}</div>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Active programs</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400">—</div>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Attendance rate</div>
          <div className="mt-2 text-2xl font-semibold text-blue-400">—</div>
        </div>
      </div>
    </Layout>
  );
}
