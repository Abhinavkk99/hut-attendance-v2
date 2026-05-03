import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      key: 'attendance',
      label: 'Mark Attendance',
      description: 'Record who showed up for your programs',
      icon: ClipboardCheck,
      tone: { bg: 'bg-blue-500/15', ring: 'ring-blue-500/20', icon: 'text-blue-400' },
      path: '/attendance',
    },
    {
      key: 'training',
      label: 'Staff Training',
      description: 'Tutorials and portal best practices',
      icon: GraduationCap,
      tone: { bg: 'bg-indigo-500/15', ring: 'ring-indigo-500/20', icon: 'text-indigo-400' },
      path: '/training',
    },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">Your staff workspace</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => navigate(a.path)}
              className="group flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-[#111113] p-5 text-left transition-all hover:border-zinc-700 hover:bg-[#141416]"
            >
              <div className="flex flex-1 gap-4">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${a.tone.bg} ${a.tone.ring}`}
                >
                  <Icon size={18} className={a.tone.icon} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{a.label}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{a.description}</div>
                </div>
              </div>
              <ArrowRight size={16} className="mt-2 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-[#111113] p-5">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">What you can do</h3>
        </div>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-blue-400" />
            Mark attendance for the programs you are assigned to
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-indigo-400" />
            Review training materials anytime
          </li>
          <li className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
            Contact an administrator if you need additional access
          </li>
        </ul>
      </div>
    </Layout>
  );
}
