import { Layout } from '../components/Layout';
import { Calendar, CheckCircle2, XCircle, Award } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  programName: string;
  date: string;
  status: 'present' | 'absent';
}

export default function ParticipantRecords() {
  const attendanceRecords: AttendanceRecord[] = [
    { id: '1', programName: 'Yoga for Beginners', date: '2026-03-10', status: 'present' },
    { id: '2', programName: 'Art Workshop', date: '2026-03-08', status: 'present' },
    { id: '3', programName: 'Yoga for Beginners', date: '2026-03-03', status: 'present' },
    { id: '4', programName: 'Book Club Meeting', date: '2026-02-28', status: 'present' },
    { id: '5', programName: 'Art Workshop', date: '2026-02-22', status: 'absent' },
    { id: '6', programName: 'Yoga for Beginners', date: '2026-02-17', status: 'present' },
    { id: '7', programName: 'Book Club Meeting', date: '2026-02-14', status: 'present' },
    { id: '8', programName: 'Yoga for Beginners', date: '2026-02-10', status: 'present' },
  ];
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);

  const currentPrograms = [
    { name: 'Yoga for Beginners', startDate: '2026-02-01', sessions: 12 },
    { name: 'Art Workshop', startDate: '2026-02-08', sessions: 8 },
    { name: 'Book Club Meeting', startDate: '2026-02-14', sessions: 6 },
  ];

  const stats = [
    { label: 'Total sessions', value: attendanceRecords.length, icon: Calendar, accent: 'text-blue-400' },
    { label: 'Sessions attended', value: presentCount, icon: CheckCircle2, accent: 'text-emerald-400' },
    { label: 'Attendance rate', value: `${attendanceRate}%`, icon: Award, accent: 'text-amber-400' },
  ];

  return (
    <Layout title="My Records" subtitle="Attendance and program participation">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</span>
                <Icon size={15} className={s.accent} />
              </div>
              <div className="mt-3 text-3xl font-semibold text-zinc-50">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800/80 bg-[#111113]">
        <div className="border-b border-zinc-800/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">Current programs</h3>
        </div>
        <ul className="divide-y divide-zinc-800/80">
          {currentPrograms.map((p, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-zinc-100">{p.name}</div>
                <div className="text-xs text-zinc-500">
                  Started {new Date(p.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-400">{p.sessions}</div>
                <div className="text-[11px] text-zinc-500">sessions</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800/80 bg-[#111113]">
        <div className="border-b border-zinc-800/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">Attendance history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Program</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {attendanceRecords.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-100">{r.programName}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        <CheckCircle2 size={11} /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-300">
                        <XCircle size={11} /> Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Award size={15} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-200">Achievements</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
            <div className="text-sm text-zinc-100">Perfect Attendance</div>
            <div className="text-xs text-zinc-500">Attended 5 sessions in a row</div>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
            <div className="text-sm text-zinc-100">Active Participant</div>
            <div className="text-xs text-zinc-500">Joined 3 different programs</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
