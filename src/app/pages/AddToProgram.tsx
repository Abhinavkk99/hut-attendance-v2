import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, UserCheck, Plus, AlertCircle } from 'lucide-react';
import { supabase, Participant, Program, isSupabaseConfigured } from '../../lib/supabase';

export default function AddToProgram() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParticipants();
    fetchPrograms();
  }, []);

  const fetchParticipants = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.from('participants').select('*').order('last_name', { ascending: true });
      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase.from('programs').select('*').order('name', { ascending: true });
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchEnrolledPrograms = async (participantId: string) => {
    if (!isSupabaseConfigured) {
      setEnrolledProgramIds(new Set());
      return;
    }
    try {
      const { data } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .eq('participant_id', participantId);
      setEnrolledProgramIds(new Set((data || []).map((r: { program_id: string }) => r.program_id)));
    } catch (err) {
      console.error('Error fetching enrolled programs:', err);
      setEnrolledProgramIds(new Set());
    }
  };

  useEffect(() => {
    if (selectedParticipant) {
      fetchEnrolledPrograms(selectedParticipant);
      setSelectedProgram('');
    } else {
      setEnrolledProgramIds(new Set());
    }
  }, [selectedParticipant]);

  const availablePrograms = useMemo(
    () => programs.filter((p) => !enrolledProgramIds.has(p.id || '')),
    [programs, enrolledProgramIds],
  );

  const filtered = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toLowerCase();
    return participants.filter(
      (p) =>
        p.first_name.toLowerCase().includes(term) ||
        p.last_name.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.includes(term))
    );
  }, [searchTerm, participants]);

  const handleAdd = async () => {
    if (!selectedParticipant || !selectedProgram) return;
    const { error } = await supabase
      .from('program_enrollments')
      .insert([{ participant_id: selectedParticipant, program_id: selectedProgram }]);
    if (error) {
      if (error.code === '23505') {
        alert('This participant is already enrolled in this program');
        return;
      }
      alert('Failed: ' + error.message);
      return;
    }
    setShowSuccess(true);
    if (selectedParticipant) await fetchEnrolledPrograms(selectedParticipant);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedParticipant(null);
      setSelectedProgram('');
    }, 1500);
  };

  const selected = participants.find((p) => p.id === selectedParticipant);

  return (
    <Layout title="Add to Program" subtitle="Enroll an existing participant in a program">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-emerald-500/30 bg-[#111113] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15">
              <UserCheck size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Enrolled</h3>
            <p className="mt-1 text-sm text-zinc-500">Participant added to the program.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-lg border border-zinc-800 bg-[#111113] py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {selected && (
        <div className="mb-4 rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-500">Selected participant</div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {selected.first_name} {selected.last_name}
              </div>
              <div className="text-xs text-zinc-500">{selected.email || '—'} · {selected.phone || '—'}</div>
            </div>
            <div className="flex-1 sm:max-w-sm">
              <label className="mb-1.5 block text-xs text-zinc-400">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                disabled={availablePrograms.length === 0}
                className="w-full rounded-lg border border-zinc-800 bg-[#0e0e10] px-3 py-2 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {availablePrograms.length === 0
                    ? 'Already enrolled in all programs'
                    : 'Choose a program…'}
                </option>
                {availablePrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.days?.join(', ')} at {p.start_time}
                  </option>
                ))}
              </select>
              {programs.length > 0 && availablePrograms.length < programs.length && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  {programs.length - availablePrograms.length} program
                  {programs.length - availablePrograms.length === 1 ? '' : 's'} hidden — already enrolled.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedParticipant(null);
                  setSelectedProgram('');
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedProgram}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-[#111113]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 md:table-cell">Email</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 lg:table-cell">Phone</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">Loading participants…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {searchTerm ? 'No participants match your search.' : 'No participants registered yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isSelected = selectedParticipant === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-500/5' : 'hover:bg-zinc-900/50'}`}
                  >
                    <td className="px-4 py-3 text-sm text-zinc-100">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-zinc-400 md:table-cell">{p.email || '—'}</td>
                    <td className="hidden px-4 py-3 text-sm text-zinc-400 lg:table-cell">{p.phone || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedParticipant(p.id || null)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow shadow-blue-500/20'
                            : 'border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:border-blue-500/60 hover:bg-blue-500/20 hover:text-blue-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
