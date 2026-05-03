import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ClipboardCheck, Check, Calendar, AlertCircle, Info } from 'lucide-react';
import { supabase, Program } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface EnrolledParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [todaysPrograms, setTodaysPrograms] = useState<Program[]>([]);
  const [programParticipants, setProgramParticipants] = useState<EnrolledParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  const todayDay = days[new Date().getDay()];
  const todayLong = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) fetchProgramParticipants(selectedProgram);
    else setProgramParticipants([]);
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      let programsData: Program[] = [];
      if (user?.role === 'staff') {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: assignments } = await supabase
            .from('program_staff')
            .select('program_id')
            .eq('user_id', authUser.id);
          const ids = assignments?.map((a: any) => a.program_id) || [];
          if (ids.length) {
            const { data } = await supabase
              .from('programs')
              .select('*')
              .in('id', ids)
              .order('name', { ascending: true });
            programsData = data || [];
          }
        }
      } else {
        const { data } = await supabase.from('programs').select('*').order('name', { ascending: true });
        programsData = data || [];
      }
      setPrograms(programsData);
      setTodaysPrograms(programsData.filter((p: any) => p.days?.includes(todayDay)));
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchProgramParticipants = async (programId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('program_enrollments')
        .select(`participant_id, participants ( id, first_name, last_name, email, phone )`)
        .eq('program_id', programId);
      const participants = data?.map((e: any) => e.participants).filter(Boolean) || [];
      setProgramParticipants(participants);
    } catch (err) {
      console.error('Error fetching program participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));

  const submit = async () => {
    if (!programParticipants.length) return;
    const records = programParticipants.map((p) => ({
      program_id: selectedProgram,
      participant_id: p.id,
      date,
      status: attendance[p.id] ? 'present' : 'absent',
    }));
    const { error } = await supabase.from('attendance_records').insert(records);
    if (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
      return;
    }
    setShowSuccess(true);
    setTimeout(() => navigate('/'), 1500);
  };

  const selectedName = programs.find((p) => p.id === selectedProgram)?.name;
  const presentCount = Object.values(attendance).filter(Boolean).length;

  if (showSuccess) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <Check size={22} className="text-emerald-400" strokeWidth={2.5} />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-emerald-200">Attendance saved</h3>
          <p className="text-sm text-emerald-300/80">Taking you back to the dashboard…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mark Attendance" subtitle="Record who showed up for today's sessions">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Date card */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <Calendar size={14} /> Today
          </div>
          <div className="mt-2 text-lg font-semibold text-zinc-100">{todayLong}</div>
          <label className="mt-4 block text-xs text-zinc-400">Session date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#0e0e10] px-3 py-2 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Program picker */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
            <ClipboardCheck size={14} /> Program
          </div>
          {todaysPrograms.length === 0 ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-300">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              No programs scheduled for {todayDay}.
            </div>
          ) : (
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setAttendance({});
              }}
              className="mt-3 w-full rounded-lg border border-zinc-800 bg-[#0e0e10] px-3 py-2.5 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Choose a program…</option>
              {todaysPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.start_time}–{p.end_time}
                </option>
              ))}
            </select>
          )}
          {selectedName && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-md bg-zinc-900 px-2 py-1 text-zinc-300">{selectedName}</span>
              <span>
                {presentCount} / {programParticipants.length} present
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      {selectedProgram && (
        <div className="mt-4 rounded-xl border border-zinc-800/80 bg-[#111113]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Roster</h3>
              <p className="text-xs text-zinc-500">Tap a row to mark someone present</p>
            </div>
            <span className="text-xs text-zinc-500">
              {programParticipants.length} enrolled
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">Loading participants…</div>
          ) : programParticipants.length === 0 ? (
            <div className="flex items-start gap-2 px-4 py-4 text-sm text-zinc-400">
              <Info size={15} className="mt-0.5 flex-shrink-0 text-zinc-500" />
              No participants enrolled in this program yet.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/80">
              {programParticipants.map((p) => {
                const present = attendance[p.id];
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => toggle(p.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/50"
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                          present
                            ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                            : 'border-zinc-700 bg-zinc-950'
                        }`}
                      >
                        {present && <Check size={13} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-zinc-100">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="truncate text-xs text-zinc-500">
                          {p.email || '—'} · {p.phone || '—'}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          present
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        {present ? 'Present' : 'Absent'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col-reverse items-stretch gap-2 border-t border-zinc-800/80 p-4 sm:flex-row sm:justify-end">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!programParticipants.length}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save attendance
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
