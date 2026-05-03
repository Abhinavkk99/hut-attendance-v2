import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, Eye, AlertCircle, ChevronDown, ChevronUp, CheckCircle2, UserX } from 'lucide-react';
import { supabase, Participant, isSupabaseConfigured } from '../../lib/supabase';

interface ParticipantWithEnrollment extends Participant {
  enrollment_count?: number;
}

export default function SearchParticipant() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState<ParticipantWithEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }
    setLoading(true);
    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .order('last_name', { ascending: true });
      if (participantsError) throw participantsError;

      const list = participantsData || [];
      if (list.length === 0) {
        setParticipants([]);
        return;
      }

      const ids = list.map((p) => p.id).filter(Boolean) as string[];
      const { data: enrollmentRows, error: enrollmentError } = await supabase
        .from('program_enrollments')
        .select('participant_id')
        .in('participant_id', ids);
      if (enrollmentError) throw enrollmentError;

      const counts = new Map<string, number>();
      (enrollmentRows || []).forEach((row: { participant_id: string }) => {
        counts.set(row.participant_id, (counts.get(row.participant_id) || 0) + 1);
      });

      setParticipants(
        list.map((p) => ({
          ...p,
          enrollment_count: counts.get(p.id || '') || 0,
        })),
      );
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const matches = (p: Participant, term: string) => {
    if (!term) return true;
    const t = term.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(t) ||
      p.last_name.toLowerCase().includes(t) ||
      (p.email && p.email.toLowerCase().includes(t)) ||
      (p.phone && p.phone.includes(t))
    );
  };

  const activeParticipants = useMemo(
    () => participants.filter((p) => (p.enrollment_count || 0) > 0 && matches(p, searchTerm)),
    [participants, searchTerm],
  );

  const inactiveParticipants = useMemo(
    () => participants.filter((p) => (p.enrollment_count || 0) === 0 && matches(p, searchTerm)),
    [participants, searchTerm],
  );

  const view = (id?: string) => id && navigate(`/participant/${id}`);

  const renderTable = (
    rows: ParticipantWithEnrollment[],
    emptyMessage: string,
    inactive: boolean,
  ) => (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-[#111113]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/40">
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
            <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">Email</th>
            <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 lg:table-cell">Phone</th>
            <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 xl:table-cell">DOB</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-sm text-zinc-100">
                  <div className="flex items-center gap-2">
                    <span>
                      {p.first_name} {p.last_name}
                    </span>
                    {inactive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400 ring-1 ring-zinc-700/60">
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-zinc-400 md:table-cell">{p.email || '—'}</td>
                <td className="hidden px-4 py-3 text-sm text-zinc-400 lg:table-cell">{p.phone || '—'}</td>
                <td className="hidden px-4 py-3 text-sm text-zinc-400 xl:table-cell">
                  {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => view(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    <Eye size={12} /> View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout title="Participants" subtitle="Search by name, email, or phone">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type a name, email, or phone…"
          className="w-full rounded-lg border border-zinc-800 bg-[#111113] py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          Loading participants…
        </div>
      ) : (
        <>
          {/* Active */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-100">
                Active participants
                <span className="ml-2 text-xs font-normal text-zinc-500">({activeParticipants.length})</span>
              </h3>
            </div>
            {renderTable(
              activeParticipants,
              searchTerm ? 'No active participants match your search.' : 'No active participants yet.',
              false,
            )}
          </section>

          {/* Inactive */}
          <section className="mt-6">
            <button
              type="button"
              onClick={() => setShowInactive((v) => !v)}
              className="mb-2 flex w-full items-center justify-between rounded-lg border border-zinc-800/80 bg-[#111113] px-4 py-2.5 text-left transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center gap-2">
                <UserX size={14} className="text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Inactive participants
                  <span className="ml-2 text-xs font-normal text-zinc-500">({inactiveParticipants.length})</span>
                </h3>
              </div>
              {showInactive ? (
                <ChevronUp size={16} className="text-zinc-500" />
              ) : (
                <ChevronDown size={16} className="text-zinc-500" />
              )}
            </button>
            {showInactive &&
              renderTable(
                inactiveParticipants,
                searchTerm ? 'No inactive participants match your search.' : 'No inactive participants.',
                true,
              )}
          </section>
        </>
      )}
    </Layout>
  );
}
