import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Check, X, Clock, Mail, AlertCircle, ShieldCheck, Info } from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: 'staff' | 'manager' | 'admin';
  created_at: string;
  approved: boolean;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '??';
}

const roleStyles: Record<string, string> = {
  admin: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  manager: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
  staff: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700/50',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to all features including user management, program creation, and attendance tracking.',
  manager: 'Can register participants and enroll them in programs. Cannot manage programs or change user roles.',
  staff: 'Limited access to mark attendance for assigned programs and view training materials.',
};

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false });
      if (fetchError) {
        setError('Failed to load pending approvals');
      } else {
        setPendingUsers(data || []);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setProcessingId(id);
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', id)
        .select();
      if (error) {
        setError(`Failed to approve user: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError('Approval was blocked by database permissions. Run the RLS policy fix in Supabase SQL Editor.');
      } else {
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const deny = async (id: string) => {
    if (!confirm('Deny this user? Their account will be deleted.')) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) setError('Failed to deny user');
      else setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Layout title="User Approvals" subtitle="Review pending staff registrations">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          Loading pending approvals…
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <ShieldCheck size={22} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-emerald-200">All caught up</h2>
          <p className="mt-1 text-sm text-emerald-300/80">No pending user approvals right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-zinc-800/80 bg-[#111113] p-5 transition-colors hover:border-zinc-700"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-1 gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                    {initials(u.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-100">{u.full_name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${roleStyles[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} /> {u.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {formatDate(u.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
                      {roleDescriptions[u.role]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 md:flex-col md:w-36">
                  <button
                    onClick={() => approve(u.id)}
                    disabled={processingId === u.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={14} /> {processingId === u.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => deny(u.id)}
                    disabled={processingId === u.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={14} /> Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-zinc-800/80 bg-[#111113] p-4 text-xs text-zinc-400">
        <Info size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
        <ul className="space-y-1">
          <li>Verify the user's identity before approving.</li>
          <li>Ensure the requested role matches their actual position.</li>
          <li>Denied users will have their accounts permanently deleted.</li>
        </ul>
      </div>
    </Layout>
  );
}
