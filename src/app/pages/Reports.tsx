import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { BarChart3, Users, Calendar, TrendingUp, Printer, Filter, X } from 'lucide-react';
import { supabase, Program, Participant, AttendanceRecord } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SA_COUNCIL_REGIONS } from '../utils/constants';

type TimeScale = 'weekly' | 'monthly' | 'annually';

interface ProgramEnrollment {
  name: string;
  count: number;
  programId?: string;
}

const AGE_RANGES = [
  { label: 'All ages', value: 'all' },
  { label: '0–12 (Children)', value: '0-12' },
  { label: '13–17 (Teens)', value: '13-17' },
  { label: '18–24 (Young adults)', value: '18-24' },
  { label: '25–54 (Adults)', value: '25-54' },
  { label: '55+ (Seniors)', value: '55+' },
];

const PROGRAM_CATEGORIES = ['Healthy Living', 'Interest & Social', 'Low Income Support', 'Young People', 'Sustainability'] as const;

const getProgramCategory = (programName: string): string => {
  const name = (programName || '').toLowerCase();
  if (name.includes('fitness') || name.includes('strength') || name.includes('chi kung') || name.includes('walking') || name.includes("men's moves")) return 'Healthy Living';
  if (name.includes('art') || name.includes('lunch') || name.includes('digital') || name.includes('mentoring')) return 'Interest & Social';
  if (name.includes('homework') || name.includes('playgroup') || name.includes('dungeons')) return 'Young People';
  if (name.includes('garden')) return 'Sustainability';
  return 'Interest & Social';
};

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'] as const;
const YES_NO = ['Yes', 'No'] as const;

const COLORS = ['#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#22D3EE', '#EC4899'];

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-[#0e0e10] px-3 py-2 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<'overview' | 'programs' | 'attendance'>('overview');
  const [timeScale, setTimeScale] = useState<TimeScale>('monthly');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allProgramEnrollments, setAllProgramEnrollments] = useState<ProgramEnrollment[]>([]);
  const [currentProgramEnrollments, setCurrentProgramEnrollments] = useState<ProgramEnrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedProgramCategory, setSelectedProgramCategory] = useState<string>('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedAtsi, setSelectedAtsi] = useState<string>('all');
  const [selectedCald, setSelectedCald] = useState<string>('all');
  const [selectedTownship, setSelectedTownship] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const calculateAge = (dob: string | null): number => {
    if (!dob) return 0;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isInAgeRange = (age: number, range: string): boolean => {
    if (range === 'all') return true;
    if (range === '0-12') return age <= 12;
    if (range === '13-17') return age >= 13 && age <= 17;
    if (range === '18-24') return age >= 18 && age <= 24;
    if (range === '25-54') return age >= 25 && age <= 54;
    if (range === '55+') return age >= 55;
    return true;
  };

  const isCald = (p: Participant): boolean => {
    return Boolean(
      (p.speak_other_language && p.speak_other_language.toLowerCase() === 'yes') ||
        (p.cultural_identity && p.cultural_identity.toLowerCase() === 'yes') ||
        (p.country_of_birth && p.country_of_birth.trim() !== '' && p.country_of_birth.toLowerCase() !== 'australia')
    );
  };

  const filteredParticipants = useMemo(
    () =>
      participants.filter((p) => {
        if (!isInAgeRange(calculateAge(p.date_of_birth), selectedAgeRange)) return false;
        if (selectedRegion !== 'all' && p.council_region !== selectedRegion) return false;
        if (selectedGender !== 'all' && p.gender !== selectedGender) return false;
        if (selectedTownship !== 'all' && p.township !== selectedTownship) return false;
        if (selectedAtsi !== 'all') {
          const v = (p.identify_aboriginal_tsi || '').toLowerCase();
          const isAtsi = v === 'yes' || v.includes('aboriginal') || v.includes('torres');
          if (selectedAtsi === 'Yes' && !isAtsi) return false;
          if (selectedAtsi === 'No' && isAtsi) return false;
        }
        if (selectedCald !== 'all') {
          const cald = isCald(p);
          if (selectedCald === 'Yes' && !cald) return false;
          if (selectedCald === 'No' && cald) return false;
        }
        return true;
      }),
    [participants, selectedAgeRange, selectedRegion, selectedGender, selectedTownship, selectedAtsi, selectedCald]
  );

  const filteredPrograms = useMemo(
    () =>
      programs.filter((p) => {
        if (selectedProgramCategory === 'all') return true;
        return getProgramCategory(p.name) === selectedProgramCategory;
      }),
    [programs, selectedProgramCategory]
  );

  const filteredParticipantIds = useMemo(() => new Set(filteredParticipants.map((p) => p.id)), [filteredParticipants]);

  useEffect(() => {
    const update = async () => {
      if (selectedProgramFilter === 'all') {
        const list = await Promise.all(
          allProgramEnrollments.map(async (enr) => {
            if (!enr.programId) return enr;
            const { data } = await supabase
              .from('program_enrollments')
              .select('participant_id')
              .eq('program_id', enr.programId);
            const ids = data?.map((e) => e.participant_id) || [];
            return { ...enr, count: ids.filter((id) => filteredParticipantIds.has(id)).length };
          })
        );
        setCurrentProgramEnrollments(list);
      } else {
        const prog = allProgramEnrollments.find((p) => p.programId === selectedProgramFilter);
        if (!prog) {
          setCurrentProgramEnrollments([]);
          return;
        }
        const { data } = await supabase
          .from('program_enrollments')
          .select('participant_id')
          .eq('program_id', selectedProgramFilter);
        const ids = data?.map((e) => e.participant_id) || [];
        setCurrentProgramEnrollments([{ ...prog, count: ids.filter((id) => filteredParticipantIds.has(id)).length }]);
      }
    };
    if (allProgramEnrollments.length > 0) update();
  }, [allProgramEnrollments, selectedProgramFilter, filteredParticipantIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: programsData } = await supabase.from('programs').select('*').order('name');
      setPrograms(programsData || []);

      const { data: participantsData } = await supabase.from('participants').select('*');
      setParticipants(participantsData || []);

      if (programsData?.length) {
        const enrollments = await Promise.all(
          programsData.map(async (prog) => {
            const { count } = await supabase
              .from('program_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('program_id', prog.id);
            return { name: prog.name, count: count || 0, programId: prog.id };
          })
        );
        setAllProgramEnrollments(enrollments);
      }

      const { data: attendanceData } = await supabase.from('attendance_records').select('*');
      setAttendanceRecords(attendanceData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalParticipants = filteredParticipants.length;
  const totalPrograms = programs.length;
  const totalEnrollments = allProgramEnrollments.reduce((sum, p) => sum + p.count, 0);
  const avgEnrollment = totalPrograms > 0 ? Math.round((totalEnrollments / totalPrograms) * 10) / 10 : 0;

  const attendanceData = useMemo(() => {
    const filtered = attendanceRecords.filter((r) => {
      if (selectedProgramFilter !== 'all' && r.program_id !== selectedProgramFilter) return false;
      if (!filteredParticipantIds.has(r.participant_id)) return false;
      return true;
    });
    const today = new Date();
    const programCaps = programs.reduce((acc, p) => {
      if (p.id) acc[p.id] = p.capacity || 30;
      return acc;
    }, {} as Record<string, number>);

    if (timeScale === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array(7).fill(null).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = filtered.filter((r) => r.date === dateStr && r.status === 'present');
        const progIds = new Set(dayRecords.map((r) => r.program_id));
        const capacity = Array.from(progIds).reduce((s, pid) => s + (programCaps[pid] || 30), 0) || 60;
        return { period: days[d.getDay()], attendance: dayRecords.length, capacity, id: `week-${i}` };
      });
    }
    if (timeScale === 'monthly') {
      return Array(4).fill(null).map((_, i) => {
        const start = new Date(today);
        start.setDate(today.getDate() - (3 - i) * 7 - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const weekRecords = filtered.filter((r) => {
          const rd = new Date(r.date);
          return rd >= start && rd <= end && r.status === 'present';
        });
        const progIds = new Set(weekRecords.map((r) => r.program_id));
        const capacity = (Array.from(progIds).reduce((s, pid) => s + (programCaps[pid] || 30), 0) || 60) * 5;
        return { period: `Week ${i + 1}`, attendance: weekRecords.length, capacity, id: `month-${i}` };
      });
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Array(12).fill(null).map((_, i) => {
      const month = (today.getMonth() - 11 + i + 12) % 12;
      const year = today.getFullYear() - (today.getMonth() - 11 + i < 0 ? 1 : 0);
      const monthRecords = filtered.filter((r) => {
        const rd = new Date(r.date);
        return rd.getMonth() === month && rd.getFullYear() === year && r.status === 'present';
      });
      const progIds = new Set(monthRecords.map((r) => r.program_id));
      const capacity = (Array.from(progIds).reduce((s, pid) => s + (programCaps[pid] || 30), 0) || 60) * 20;
      return { period: months[month], attendance: monthRecords.length, capacity, id: `year-${i}` };
    });
  }, [attendanceRecords, timeScale, selectedProgramFilter, filteredParticipantIds, programs]);

  const pieData = useMemo(
    () =>
      currentProgramEnrollments.map((p, i) => ({
        name: p.name,
        value: p.count,
        id: p.programId || `program-${i}`,
      })),
    [currentProgramEnrollments]
  );

  const avgAttendance =
    attendanceData.length > 0
      ? Math.round(attendanceData.reduce((s, d) => s + d.attendance, 0) / attendanceData.length)
      : 0;
  const totalAttendance = attendanceData.reduce((s, d) => s + d.attendance, 0);
  const totalCapacity = attendanceData.reduce((s, d) => s + d.capacity, 0);
  const attendanceRate = totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0;

  const hasActiveFilter =
    selectedProgramFilter !== 'all' ||
    selectedProgramCategory !== 'all' ||
    selectedAgeRange !== 'all' ||
    selectedRegion !== 'all' ||
    selectedGender !== 'all' ||
    selectedAtsi !== 'all' ||
    selectedCald !== 'all' ||
    selectedTownship !== 'all';

  const townshipOptions = useMemo(
    () => Array.from(new Set(participants.map((p) => p.township).filter(Boolean))).sort(),
    [participants]
  );

  const clearAllFilters = () => {
    setSelectedProgramFilter('all');
    setSelectedProgramCategory('all');
    setSelectedAgeRange('all');
    setSelectedRegion('all');
    setSelectedGender('all');
    setSelectedAtsi('all');
    setSelectedCald('all');
    setSelectedTownship('all');
  };

  const reportTabs = [
    { key: 'overview' as const, label: 'Overview', description: 'General statistics', icon: BarChart3 },
    { key: 'programs' as const, label: 'Programs', description: 'Program enrollment', icon: Calendar },
    { key: 'attendance' as const, label: 'Attendance', description: 'Attendance trends', icon: TrendingUp },
  ];

  const timeScaleTabs: Array<{ key: TimeScale; label: string }> = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'annually', label: 'Annually' },
  ];

  return (
    <Layout title="Reports" subtitle="Attendance, enrollment and demographics">
      {/* Filters */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={14} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Filters</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Program category</label>
            <select
              value={selectedProgramCategory}
              onChange={(e) => setSelectedProgramCategory(e.target.value)}
              className={inputClass}
            >
              <option value="all">All categories</option>
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Program</label>
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All programs</option>
              {filteredPrograms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Age range</label>
            <select
              value={selectedAgeRange}
              onChange={(e) => setSelectedAgeRange(e.target.value)}
              className={inputClass}
            >
              {AGE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className={inputClass}
            >
              <option value="all">All genders</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">ATSI status</label>
            <select
              value={selectedAtsi}
              onChange={(e) => setSelectedAtsi(e.target.value)}
              className={inputClass}
            >
              <option value="all">All</option>
              {YES_NO.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">CALD background</label>
            <select
              value={selectedCald}
              onChange={(e) => setSelectedCald(e.target.value)}
              className={inputClass}
            >
              <option value="all">All</option>
              {YES_NO.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Council region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className={inputClass}
            >
              <option value="all">All regions</option>
              {SA_COUNCIL_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Township</label>
            <select
              value={selectedTownship}
              onChange={(e) => setSelectedTownship(e.target.value)}
              className={inputClass}
            >
              <option value="all">All townships</option>
              {townshipOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        {hasActiveFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedProgramCategory !== 'all' && (
              <FilterChip label={`Category: ${selectedProgramCategory}`} onClear={() => setSelectedProgramCategory('all')} />
            )}
            {selectedProgramFilter !== 'all' && (
              <FilterChip
                label={`Program: ${programs.find((p) => p.id === selectedProgramFilter)?.name}`}
                onClear={() => setSelectedProgramFilter('all')}
              />
            )}
            {selectedAgeRange !== 'all' && (
              <FilterChip
                label={`Age: ${AGE_RANGES.find((r) => r.value === selectedAgeRange)?.label}`}
                onClear={() => setSelectedAgeRange('all')}
              />
            )}
            {selectedGender !== 'all' && (
              <FilterChip label={`Gender: ${selectedGender}`} onClear={() => setSelectedGender('all')} />
            )}
            {selectedAtsi !== 'all' && (
              <FilterChip label={`ATSI: ${selectedAtsi}`} onClear={() => setSelectedAtsi('all')} />
            )}
            {selectedCald !== 'all' && (
              <FilterChip label={`CALD: ${selectedCald}`} onClear={() => setSelectedCald('all')} />
            )}
            {selectedRegion !== 'all' && (
              <FilterChip label={`Region: ${selectedRegion}`} onClear={() => setSelectedRegion('all')} />
            )}
            {selectedTownship !== 'all' && (
              <FilterChip label={`Township: ${selectedTownship}`} onClear={() => setSelectedTownship('all')} />
            )}
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Time scale + print */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-zinc-800 bg-[#111113] p-0.5">
          {timeScaleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeScale(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                timeScale === t.key ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Report type tabs */}
      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={14} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Select report type</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {reportTabs.map((t) => {
            const Icon = t.icon;
            const active = selectedReport === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedReport(t.key)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  active
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${
                    active ? 'bg-blue-500/15 ring-blue-500/20' : 'bg-zinc-900 ring-zinc-800'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-blue-400' : 'text-zinc-400'} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>
                    {t.label}
                  </div>
                  <div className="text-xs text-zinc-500">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          Loading data…
        </div>
      )}

      {/* Overview */}
      {!loading && selectedReport === 'overview' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total participants" value={totalParticipants} icon={Users} accent="text-blue-400" />
            <StatCard label="Active programs" value={totalPrograms} icon={Calendar} accent="text-emerald-400" />
            <StatCard label="Avg. enrollment" value={avgEnrollment} icon={TrendingUp} accent="text-purple-400" />
          </div>

          <ChartCard title={`Attendance trend (${timeScale})`}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262b" />
              <XAxis dataKey="period" tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fafafa' }} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2.5} name="Attendance" dot={{ fill: '#3B82F6' }} />
              <Line type="monotone" dataKey="capacity" stroke="#10B981" strokeWidth={2.5} name="Capacity" dot={{ fill: '#10B981' }} />
            </LineChart>
          </ChartCard>

          <div className="rounded-xl border border-zinc-800/80 bg-[#111113]">
            <div className="border-b border-zinc-800/80 px-4 py-3">
              <h4 className="text-sm font-semibold text-zinc-100">Recent registrations</h4>
            </div>
            {participants.length > 0 ? (
              <ul className="divide-y divide-zinc-800/80">
                {participants
                  .slice()
                  .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                  .slice(0, 5)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-zinc-100">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="truncate text-xs text-zinc-500">{p.email}</div>
                      </div>
                      <div className="whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-zinc-500">No participants registered yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Programs */}
      {!loading && selectedReport === 'programs' && (
        <div className="mt-4 space-y-4">
          <ChartCard title="Program enrollment">
            <BarChart data={currentProgramEnrollments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262b" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                stroke="#3f3f46"
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fafafa' }} />
              <Bar dataKey="count" fill="#3B82F6" name="Participants" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Program distribution">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={(entry: any) => `${entry.name}: ${entry.value}`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.id || `cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fafafa' }} />
            </PieChart>
          </ChartCard>

          <div className="rounded-xl border border-zinc-800/80 bg-[#111113]">
            <div className="border-b border-zinc-800/80 px-4 py-3">
              <h4 className="text-sm font-semibold text-zinc-100">Detailed enrollment</h4>
            </div>
            <div className="divide-y divide-zinc-800/80">
              {currentProgramEnrollments.map((prog) => {
                const pct = totalParticipants > 0 ? (prog.count / totalParticipants) * 100 : 0;
                return (
                  <div key={prog.programId || prog.name} className="px-4 py-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm text-zinc-100">{prog.name}</span>
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                        {prog.count} participant{prog.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendance */}
      {!loading && selectedReport === 'attendance' && (
        <div className="mt-4 space-y-4">
          <ChartCard title={`Attendance vs capacity (${timeScale})`}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262b" />
              <XAxis dataKey="period" tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} stroke="#3f3f46" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fafafa' }} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
              <Bar dataKey="attendance" fill="#3B82F6" name="Attendance" radius={[6, 6, 0, 0]} />
              <Bar dataKey="capacity" fill="#10B981" name="Capacity" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Average attendance" value={avgAttendance} icon={Users} accent="text-blue-400" />
            <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={TrendingUp} accent="text-emerald-400" />
            <StatCard label="Total sessions" value={attendanceData.length} icon={Calendar} accent="text-purple-400" />
          </div>
        </div>
      )}
    </Layout>
  );
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#111113',
  border: '1px solid #26262b',
  borderRadius: 8,
  fontSize: 12,
  color: '#fafafa',
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
        <Icon size={15} className={accent} />
      </div>
      <div className="mt-3 text-3xl font-semibold text-zinc-50">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#111113]">
      <div className="border-b border-zinc-800/80 px-4 py-3">
        <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={320}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/20">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 transition-colors hover:bg-blue-500/20">
        <X size={10} />
      </button>
    </span>
  );
}
